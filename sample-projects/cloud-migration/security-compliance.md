# Security & Compliance - Cloud Migration

## Compliance Requirements

### SOC 2 Type II Certification
**Why:** Required to sell to enterprise customers (>$500K deal pipeline blocked)

**Timeline:** Must achieve within 6 months of migration

**Key Controls Required:**
1. Access control and user management
2. Encryption at rest and in transit
3. Network security and segmentation
4. Logging and monitoring
5. Incident response procedures
6. Change management
7. Vendor management

### GDPR Compliance
**Scope:** 15% of customer base in EU

**Requirements:**
- Data residency (EU data must stay in EU)
- Right to deletion
- Data breach notification (72 hours)
- Privacy by design

**AWS Consideration:** Use eu-west-1 (Ireland) region for EU customer data

### PCI DSS (Future)
**Status:** Not currently required but on roadmap for direct payment processing

**Level:** Level 4 (< 20K transactions/year)

---

## AWS Security Architecture

### 1. Network Security

#### VPC Design Decision
**Option A: Single VPC, Multi-Tier**
```
┌─────────────────────────────────────┐
│           VPC (10.0.0.0/16)        │
│  ┌──────────────────────────────┐  │
│  │  Public Subnets              │  │
│  │  (Load Balancers, NAT)       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Private Subnets             │  │
│  │  (Application Servers)       │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  Data Subnets                │  │
│  │  (Databases, Cache)          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Option B: Multi-VPC (Dev/Staging/Prod)**
- Separate VPCs for each environment
- VPC peering for shared services
- Better isolation, more complex

**Decision:** Start with Option A (simpler), migrate to Option B if needed

#### Security Groups Strategy
- Default deny all
- Principle of least privilege
- Application-tier-based groups:
  - `sg-alb` (Allow 80/443 from internet)
  - `sg-app` (Allow ALB → App on port 8080)
  - `sg-database` (Allow App → DB on 5432)
  - `sg-cache` (Allow App → Redis on 6379)

#### NACLs (Network ACLs)
- Subnet-level firewall (defense in depth)
- Block known malicious IPs
- Rate limiting protection

---

### 2. Identity & Access Management

#### IAM Strategy

**Human Users:**
- SSO integration with existing Okta
- MFA required for all users
- No IAM users with long-term credentials
- Temporary credentials via AWS SSO

**Service Accounts:**
- EC2 instance roles (no embedded credentials)
- ECS task roles for containers
- Lambda execution roles
- Principle of least privilege

**Third-Party Integrations:**
- External ID for AssumeRole
- Regular credential rotation
- Audit logging of all access

#### Role Structure
```
Production Account Roles:
├── Admin-Role (break-glass only)
├── Developer-ReadOnly
├── DevOps-Deploy
├── EC2-Application-Role
├── Lambda-Execution-Role
└── RDS-Enhanced-Monitoring
```

---

### 3. Data Protection

#### Encryption at Rest
**Decision: Encrypt everything by default**

- **EBS volumes:** AWS KMS encryption (CMK)
- **RDS databases:** Transparent Data Encryption (TDE)
- **S3 buckets:** SSE-S3 or SSE-KMS
- **ElastiCache:** Encryption enabled
- **Snapshots:** Encrypted with same key as source

**Key Management:**
- AWS KMS Customer Managed Keys (CMK)
- Separate keys per environment
- Automatic key rotation enabled
- Key access logged in CloudTrail

#### Encryption in Transit
- TLS 1.2+ required for all external connections
- ACM certificates for load balancers
- RDS connections require SSL
- Application-level encryption for sensitive data

#### Secrets Management
**Options:**
1. **AWS Secrets Manager** - $0.40/secret/month, rotation built-in
2. **AWS Systems Manager Parameter Store** - Free tier, basic features
3. **HashiCorp Vault** - Self-managed, most features

**Decision:** AWS Secrets Manager
- Automatic rotation for RDS credentials
- Integration with Lambda, ECS
- Audit logging
- Cost acceptable for our scale (~50 secrets = $20/month)

---

### 4. Logging & Monitoring

#### CloudTrail (Audit Logging)
- Enable in all regions
- Log API calls to all AWS services
- Send logs to dedicated S3 bucket
- S3 bucket versioning + lifecycle (90-day retention in S3, 7 years in Glacier)
- CloudWatch Logs integration for real-time alerts

**Critical Alerts:**
- Root account usage
- MFA-disabled users
- Security group changes
- IAM policy changes
- Failed authentication attempts (>5 in 5 minutes)

#### VPC Flow Logs
- Capture all network traffic
- Store in CloudWatch Logs
- Analyze for anomalies (unexpected connections)
- Retention: 30 days

#### Application Logging
- Centralized logging to CloudWatch Logs
- Log groups per application/environment
- Structured logging (JSON format)
- Encryption at rest

#### Monitoring Stack
- **AWS CloudWatch:** Metrics, logs, alarms
- **AWS GuardDuty:** Threat detection
- **AWS Security Hub:** Compliance scanning
- **Third-party SIEM:** Splunk or Datadog (TBD)

---

### 5. Incident Response

#### Incident Response Plan

**Phase 1: Detection**
- Automated alerts from CloudWatch, GuardDuty
- Manual reporting channel (#security-alerts Slack)
- 24/7 on-call rotation

**Phase 2: Containment**
- Isolate affected resources (security group modification)
- Snapshot for forensics
- Revoke compromised credentials
- Enable AWS GuardDuty if not already active

**Phase 3: Investigation**
- CloudTrail log analysis
- VPC Flow Log review
- Application log correlation
- Determine scope of breach

**Phase 4: Recovery**
- Patch vulnerabilities
- Restore from clean backups if needed
- Rotate all potentially compromised credentials
- Update security groups/NACLs

**Phase 5: Post-Mortem**
- Document incident timeline
- Identify root cause
- Update runbooks
- Implement preventive controls

#### Incident Severity Levels
- **P0 (Critical):** Active data breach, production down
- **P1 (High):** Potential breach, security control failure
- **P2 (Medium):** Failed access attempts, configuration drift
- **P3 (Low):** Policy violations, minor misconfigurations

---

### 6. Compliance Automation

#### AWS Config Rules
Continuous compliance monitoring:
- `encrypted-volumes` - All EBS volumes must be encrypted
- `rds-encryption-enabled` - All RDS instances encrypted
- `s3-bucket-public-read-prohibited` - No public S3 buckets
- `iam-user-mfa-enabled` - All IAM users require MFA
- `restricted-ssh` - Security groups don't allow 0.0.0.0/0 on port 22

#### Automated Remediation
- Non-compliant resources automatically tagged
- SNS notifications to security team
- Auto-remediation for low-risk issues (Lambda functions)

#### Regular Audits
- Monthly: Config compliance review
- Quarterly: IAM access review (remove unused permissions)
- Annually: External penetration testing
- Continuous: Automated vulnerability scanning (AWS Inspector)

---

## Open Questions / Decisions Needed

### 1. WAF (Web Application Firewall)
**Question:** Do we need AWS WAF for the ALB?

**Considerations:**
- Cost: ~$5/month + $1 per million requests
- Protection: SQL injection, XSS, rate limiting
- Complexity: Rules maintenance

**Recommendation:** Yes, implement for production (cost worth it for security)

### 2. DDoS Protection
**Options:**
- **AWS Shield Standard:** Free, basic protection
- **AWS Shield Advanced:** $3,000/month, 24/7 DDoS response team

**Question:** Is Shield Advanced worth it?

**Recommendation:** Start with Standard, evaluate Advanced if we see attacks

### 3. Backup Strategy
**Options:**
- **AWS Backup:** Centralized backup management
- **Custom scripts:** More control, more work

**Recommendation:** AWS Backup (automated, policy-based, meets compliance)

### 4. Disaster Recovery
**RTO (Recovery Time Objective):** How quickly must we recover?
**RPO (Recovery Point Objective):** How much data loss is acceptable?

**Current thinking:**
- RTO: 4 hours
- RPO: 15 minutes
- Multi-AZ RDS provides this (sync replication)
- Cross-region backups for true disaster (region failure)

# Data Warehouse Architecture - Technical Options

## Architecture Decision: Data Warehouse Platform

### Option 1: AWS Redshift (Traditional Data Warehouse)

**Architecture:**
```
Data Sources → AWS Glue ETL → Amazon Redshift → BI Tools
              ↓
           S3 Data Lake
```

**Pros:**
- Mature, battle-tested technology
- Excellent SQL performance for analytics
- Integration with AWS ecosystem
- Columnar storage optimized for analytics
- Supports petabyte scale

**Cons:**
- Must manage cluster sizing and scaling
- Higher costs for always-on workloads
- Less flexible for ad-hoc queries on raw data
- Requires careful schema design upfront

**Cost Estimate:**
- Redshift cluster (dc2.large, 2 nodes): $360/month
- S3 storage (2TB): $46/month
- Glue ETL: $220/month
- Data transfer: $50/month
- **Total: ~$676/month**

**Best for:** Predictable query patterns, heavy aggregation workloads

---

### Option 2: Snowflake (Cloud Data Warehouse)

**Architecture:**
```
Data Sources → Fivetran/Airbyte → Snowflake → BI Tools
```

**Pros:**
- Separate compute and storage (elastic scaling)
- Pay only for what you use (per-second billing)
- Zero maintenance (fully managed)
- Excellent performance and concurrency
- Built-in data sharing capabilities
- Time travel and cloning features

**Cons:**
- Higher per-query costs than Redshift
- Vendor lock-in
- Can get expensive with poor query optimization

**Cost Estimate:**
- Storage (2TB): $46/month
- Compute (X-Small, 8hrs/day): $384/month
- Data ingestion (Fivetran): $500/month
- **Total: ~$930/month**

**Best for:** Variable workloads, rapid scaling needs, easy to get started

---

### Option 3: BigQuery (Serverless Data Warehouse)

**Architecture:**
```
Data Sources → Cloud Functions/Airflow → BigQuery → Looker
```

**Pros:**
- True serverless (no infrastructure management)
- Scales automatically to petabytes
- Pay per query (no idle costs)
- Fast setup and deployment
- Built-in ML capabilities (BigQuery ML)
- Integration with Google Analytics 360

**Cons:**
- Costs can be unpredictable with large queries
- Less control over performance tuning
- Requires Google Cloud (separate from AWS)
- Learning curve for cost optimization

**Cost Estimate:**
- Storage (2TB): $40/month
- Queries (~10TB scanned/month): $50/month
- Streaming inserts: $20/month
- **Total: ~$110/month**

**Best for:** Unpredictable query patterns, minimal ops overhead, cost-sensitive

---

### Option 4: Modern Data Stack (Lakehouse Architecture)

**Architecture:**
```
Data Sources → Airbyte → S3 (Parquet) → dbt → Athena/Presto
                              ↓
                         Iceberg/Delta Lake
                              ↓
                          BI Tools
```

**Components:**
- **Storage:** S3 with Apache Iceberg or Delta Lake
- **ETL:** Airbyte (open source)
- **Transformation:** dbt (data build tool)
- **Query Engine:** Athena or Trino/Presto
- **Orchestration:** Apache Airflow

**Pros:**
- Most cost-effective (S3 storage is cheap)
- Open standards (no vendor lock-in)
- Flexibility to use multiple query engines
- Modern, popular tech stack (easier hiring)
- Best for advanced use cases (ML, data science)

**Cons:**
- More components to manage
- Requires stronger technical team
- Query performance not as good as dedicated warehouses
- More setup complexity

**Cost Estimate:**
- S3 storage (2TB): $46/month
- Athena queries (~5TB scanned): $25/month
- EC2 for Airflow (t3.medium): $30/month
- Airbyte (self-hosted): $0
- **Total: ~$101/month**

**Best for:** Technical teams, cost optimization, flexibility

---

## Comparison Matrix

| Factor | Redshift | Snowflake | BigQuery | Lakehouse |
|--------|----------|-----------|----------|-----------|
| **Ease of Setup** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Cost (Low is better)** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Scalability** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Maintenance** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Flexibility** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Team Expertise Required** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## ETL/ELT Tool Decision

### Option A: AWS Glue
- Serverless ETL service
- Visual ETL designer
- Good for AWS-native workloads
- Cost: ~$0.44/DPU-hour

### Option B: Fivetran
- Fully managed, zero maintenance
- 150+ pre-built connectors
- Automatic schema changes
- Cost: $500-2,000/month depending on volume

### Option C: Airbyte (Open Source)
- Open source (free)
- 300+ connectors
- Self-hosted or cloud
- Cost: Infrastructure only (~$50/month for EC2)

### Option D: Custom Python Scripts
- Maximum control
- Good for simple pipelines
- Requires development and maintenance
- Cost: Developer time only

**Recommendation:** Fivetran for Phase 1 (speed), consider Airbyte later for cost optimization

---

## Data Transformation: dbt (data build tool)

**Why dbt?**
- SQL-based transformations (familiar to analysts)
- Version control for data models
- Documentation and lineage
- Testing and data quality checks
- Modular, reusable code

**Deployment:**
- dbt Core (open source) on EC2: ~$30/month
- dbt Cloud (managed): $100-500/month

**Transformation Pattern:**
```
Raw Data (source tables)
    ↓
Staging (cleaned, typed)
    ↓
Intermediate (business logic)
    ↓
Marts (final dimensional models)
```

---

## BI Tool Decision

### Option 1: Tableau
**Pros:**
- Industry standard, powerful visualizations
- Good for complex analytics
- Large community and resources

**Cons:**
- Expensive ($70/user/month for Creator, $15 for Viewer)
- Steeper learning curve
- Desktop + Server setup complexity

**Cost:** 5 Creators + 45 Viewers = $1,025/month

### Option 2: Looker (Google)
**Pros:**
- LookML (code-based modeling)
- Excellent governance
- Embedded analytics capabilities

**Cons:**
- Very expensive ($3,000-5,000/month minimum)
- Requires LookML expertise
- Best with BigQuery

**Cost:** ~$3,500/month minimum

### Option 3: Metabase (Open Source)
**Pros:**
- Free and open source
- Easy to use for non-technical users
- Good SQL editor for analysts
- Self-hosted or cloud

**Cons:**
- Less powerful than Tableau
- Limited advanced analytics
- Smaller community

**Cost:** $0 (self-hosted) or $85/month (cloud starter)

### Option 4: Apache Superset
**Pros:**
- Free and open source
- Modern interface
- SQL IDE built-in
- Good for technical teams

**Cons:**
- Requires self-hosting
- Smaller ecosystem than Tableau
- Less polished UX

**Cost:** $50/month (EC2 hosting)

**Recommendation:** 
- **Phase 1:** Metabase (quick start, low cost)
- **Phase 2:** Evaluate Tableau if advanced features needed

---

## Recommended Architecture: Hybrid Approach

### Phase 1: Quick Wins (Months 1-3)
```
Salesforce ──┐
Stripe ──────┤
PostgreSQL ──┼──> Fivetran ──> BigQuery ──> dbt ──> Metabase
Google Analytics ─┘                  ↓
                                Data Quality Tests
```

**Why:**
- Fastest time to value
- Lowest infrastructure complexity
- Pay-per-use (no upfront costs)
- Easy to pivot if needed

**Estimated Cost:** $800/month

### Phase 2: Scale & Optimize (Months 4-6)
```
Data Sources ──> Airbyte ──> S3 (Iceberg) ──> dbt ──> Trino ──> Metabase
                               ↓                              ↓
                          Data Catalog                    Tableau
                                                       (for power users)
```

**Why:**
- Reduced costs (S3 vs BigQuery)
- More flexibility (lakehouse pattern)
- Better for ML/data science workloads

**Estimated Cost:** $500/month

---

## Open Technical Questions

### 1. Real-Time Requirements
**Question:** Which metrics need real-time updates vs batch is OK?

**Options:**
- Batch only (15-min to 1-hour latency): Simplest, cheapest
- Hybrid (some real-time, some batch): Streaming for critical metrics
- Fully real-time: Most complex, highest cost

**Recommendation:** Start with batch, add streaming incrementally

### 2. Data Modeling Approach
**Question:** Dimensional modeling (Kimball) vs OBT (one big table) vs Data Vault?

**Options:**
- **Kimball (Star Schema):** Facts + Dimensions, traditional analytics
- **OBT:** Denormalized wide tables, simple for BI tools
- **Data Vault:** Most flexible, complex to implement

**Recommendation:** Kimball star schema (battle-tested, BI tool friendly)

### 3. Data Governance
**Question:** Who approves metric definitions? How do we ensure consistency?

**Needs:**
- Metrics repository (dbt docs + wiki)
- Approval workflow for new metrics
- Data stewards per domain (Finance, Product, etc.)

### 4. Disaster Recovery
**Question:** What's the acceptable data loss window?

**Options:**
- Daily backups (24-hour data loss acceptable)
- Point-in-time recovery (minimal data loss)

**Recommendation:** Daily backups initially, evaluate PITR if needed

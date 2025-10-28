import Document from '../models/Document.js';
import Decision from '../models/Decision.js';
import Project from '../models/Project.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Total documents
    const totalDocuments = await Document.countDocuments({ userId: req.user._id });
    
    // Total decisions
    const totalDecisions = await Decision.countDocuments({ userId: req.user._id });
    
    // Categories breakdown
    const categoriesAgg = await Decision.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const categories = {};
    categoriesAgg.forEach(item => {
      categories[item._id] = item.count;
    });
    
    // Get recent projects with their decisions
    const recentProjects = await Project.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(5);
    
    const projectsWithDecisions = await Promise.all(
      recentProjects.map(async (project) => {
        const decisions = await Decision.find({ 
          projectId: project._id,
          userId: req.user._id
        })
          .sort({ extractedAt: -1 })
          .limit(3);
        
        return {
          _id: project._id,
          name: project.name,
          description: project.description,
          updatedAt: project.updatedAt,
          decisions
        };
      })
    );
    
    res.json({
      total_documents: totalDocuments,
      total_decisions: totalDecisions,
      categories,
      recent_projects: projectsWithDecisions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

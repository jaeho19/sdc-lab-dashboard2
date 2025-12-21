import React from 'react';
import { LabProject } from '../types';
import { Calendar, Building2 } from 'lucide-react';

interface ProjectListProps {
  projects: LabProject[];
}

const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Funded Projects</h2>
          <p className="text-slate-500">Current research grants and contracts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded uppercase">
                  {project.status}
                </span>
                <span className="text-sm text-slate-500 flex items-center">
                  <Building2 className="w-4 h-4 mr-1" />
                  {project.fundingSource}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{project.title}</h3>
              {project.description && (
                <p className="text-slate-600 text-sm mb-3">{project.description}</p>
              )}
              <div className="flex items-center text-sm text-blue-600 font-medium">
                <Calendar className="w-4 h-4 mr-2" />
                {project.period}
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 md:ml-6 flex items-center space-x-3">
              <button className="text-sm text-slate-500 hover:text-slate-900 font-medium underline">
                View Details
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
            <div className="text-center py-10 text-slate-400">No active funded projects.</div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
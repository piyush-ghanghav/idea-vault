'use client';
import  {Idea, DOMAIN_COLORS} from '@idea-vault/types';

interface Props{
    idea: Idea;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: string) => void;
}

export function IdeaCard({idea, onDelete, onStatusChange}: Props){
    const colors = DOMAIN_COLORS[idea.domain];
    
    return (
         <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-base leading-snug">{idea.title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
          {idea.domain}
        </span>
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{idea.rawDump}</p>

      {idea.enrichment && (
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">AI Summary</p>
          <p className="text-sm text-gray-700">{idea.enrichment.summary}</p>
        </div>
      )}
      {!idea.enrichment && (
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Enrichment pending...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <select
          value={idea.status}
          onChange={e => onStatusChange(idea.id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
        >
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="PARKED">Parked</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <button
          onClick={() => onDelete(idea.id)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
    );
}

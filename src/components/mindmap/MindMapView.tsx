import React, { useState } from 'react';
import {
  Network,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { MindMapNode, PageId } from '../../types';
import { sampleMindMapData, samplePhysicsMindMap } from '../../data/mockData';

interface MindMapViewProps {
  onNavigate: (page: PageId) => void;
  onExplainConcept: (conceptTitle: string) => void;
  onGenerateQuestions: (conceptTitle: string) => void;
}

export const MindMapView: React.FC<MindMapViewProps> = ({
  onNavigate,
  onExplainConcept,
  onGenerateQuestions,
}) => {
  const [selectedMapSubject, setSelectedMapSubject] = useState<'AI' | 'Physics'>('Physics');
  const [activeNode, setActiveNode] = useState<MindMapNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root-phys': true,
    'charge-current': true,
    'voltage-emf': true,
    'resistance-law': true,
    'power-energy': true,
    'root-ai': true,
    'ml': true,
    'dl': true,
    'agents': true,
  });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const rootData = selectedMapSubject === 'Physics' ? samplePhysicsMindMap : sampleMindMapData;

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleGenerateMindMap = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 800);
  };

  // Render hierarchical node element
  const renderNode = (node: MindMapNode, level: number = 0) => {
    const isExpanded = expandedNodes[node.id] ?? true;
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = activeNode?.id === node.id;

    return (
      <div key={node.id} className="relative flex flex-col items-start my-1.5 pl-4 border-l-2 border-slate-200">
        <div
          onClick={() => setActiveNode(node)}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            isSelected
              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
              : level === 0
              ? 'bg-slate-900 text-white border-slate-800 font-bold'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-semibold'
          }`}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="p-0.5 rounded hover:bg-slate-200/50 text-slate-400"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}

          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: node.color || '#6366f1' }}
          />

          <span className="text-xs">{node.label}</span>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col ml-3 mt-1 space-y-1">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-bold text-emerald-800">
            <Network className="w-3.5 h-3.5" />
            Visual Knowledge Graph
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Interactive Concept Mind Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Explore topic hierarchies, relationships, and drill down into AI explanations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedMapSubject('Physics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMapSubject === 'Physics'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Physics: Electricity
            </button>
            <button
              onClick={() => setSelectedMapSubject('AI')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedMapSubject === 'AI'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AI & ML
            </button>
          </div>

          <button
            disabled={isGenerating}
            onClick={handleGenerateMindMap}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Generate Mind Map</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Inspection Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Tree Stage (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 relative overflow-hidden flex flex-col justify-between min-h-[450px]">
          {/* Zoom controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xs z-10">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-500 px-1 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Mind Map Tree */}
          <div
            className="overflow-auto max-h-[520px] p-4 transition-transform duration-150 origin-top-left"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {renderNode(rootData)}
          </div>

          {/* Hint */}
          <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-100">
            💡 Click any concept node to inspect definitions, launch AI teacher explanations, or generate questions.
          </div>
        </div>

        {/* Node Inspection Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Concept Inspector
              </h2>
            </div>

            {activeNode ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Selected Node
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{activeNode.label}</h3>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                  {activeNode.description || 'Core foundational node connected to governing circuit equations.'}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Network className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Select any node on the left to reveal details</p>
              </div>
            )}
          </div>

          {/* Actions: Explain this concept & Generate questions */}
          {activeNode && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => onExplainConcept(activeNode.label)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explain this concept with AI</span>
              </button>

              <button
                onClick={() => onGenerateQuestions(activeNode.label)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Generate Questions from this</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

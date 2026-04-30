import { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion } from "motion/react";
import { Wrench, AlertTriangle, Clock, CheckCircle2, Image as ImageIcon, Calendar, Loader2 } from "lucide-react";
import { MaintenanceAPI } from "../services/backend.service";

interface MaintenanceRequest {
  id: string;
  title: string;
  property: string;
  unit: string;
  priority: "low" | "medium" | "high";
  category: string;
  description: string;
  submittedDate: string;
  estimatedCost?: number;
  hasPhoto: boolean;
  assignedTo?: string;
  status: string;
}

const toKanbanStatus = (s: string): string => {
  if (s === "in_progress" || s === "assigned") return "in-progress";
  if (s === "completed") return "completed";
  return "open";
};

const toApiStatus = (kanban: string): string => {
  if (kanban === "in-progress") return "in_progress";
  if (kanban === "completed") return "completed";
  return "submitted";
};

interface KanbanColumnProps {
  title: string;
  status: string;
  requests: MaintenanceRequest[];
  onDrop: (requestId: string, newStatus: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DraggableCardProps {
  request: MaintenanceRequest;
}

const DraggableCard = ({ request }: DraggableCardProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "MAINTENANCE_REQUEST",
    item: { id: request.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const priorityConfig = {
    high: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "🔥" },
    medium: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "⚠️" },
    low: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "ℹ️" }
  };

  const config = priorityConfig[request.priority];

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-lg border-2 ${config.border} p-4 cursor-move mb-3 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-slate-900 text-sm">{request.title}</h4>
        <span className="text-lg">{config.icon}</span>
      </div>

      <p className="text-xs text-slate-600 mb-3">
        {request.property} - {request.unit}
      </p>

      <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
        <Calendar className="size-3" />
        <span>{request.submittedDate}</span>
      </div>

      {request.hasPhoto && (
        <div className="flex items-center gap-1 text-xs text-indigo-600 mb-2">
          <ImageIcon className="size-3" />
          <span>Photo attached</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.bg} ${config.text}`}>
          {request.priority}
        </span>
        {request.estimatedCost && (
          <span className="text-xs font-semibold text-slate-900">
            ${request.estimatedCost}
          </span>
        )}
      </div>

      {request.assignedTo && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Assigned to: <span className="font-medium text-slate-700">{request.assignedTo}</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};

const KanbanColumn = ({ title, status, requests, onDrop, icon: Icon, color }: KanbanColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "MAINTENANCE_REQUEST",
    drop: (item: { id: string }) => onDrop(item.id, status),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`bg-gradient-to-br ${color} rounded-xl p-4 mb-4`}>
        <div className="flex items-center gap-3 text-white">
          <Icon className="size-6" />
          <div className="flex-1">
            <h3 className="font-normal text-[20px] text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{title}</h3>
            <p className="text-[13px] text-white/80">{requests.length} requests</p>
          </div>
        </div>
      </div>

      <div
        ref={drop}
        className={`min-h-[400px] p-4 rounded-xl border-2 border-dashed transition-colors ${
          isOver ? "bg-[#E5F4EE] border-[#0A7A52]" : "bg-white border-[rgba(0,0,0,0.07)]"
        }`}
      >
        {requests.map((request) => (
          <DraggableCard key={request.id} request={request} />
        ))}
        {requests.length === 0 && (
          <div className="flex items-center justify-center h-32 text-[#767570] text-[14px]">
            No requests
          </div>
        )}
      </div>
    </div>
  );
};

export function MaintenanceKanban() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MaintenanceAPI.getAll()
      .then(raw => setRequests(
        raw.map((r: any) => ({
          id: r.id,
          title: r.title ?? "Untitled Request",
          property: r.propertyId ?? "—",
          unit: r.unitId ?? "—",
          priority: (r.priority === "emergency" ? "high" : r.priority) ?? "low",
          category: r.category ?? "General",
          description: r.description ?? "",
          submittedDate: r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "—",
          estimatedCost: r.estimatedCost,
          hasPhoto: Array.isArray(r.photos) && r.photos.length > 0,
          assignedTo: r.assignedTo,
          status: toKanbanStatus(r.status ?? "submitted"),
        }))
      ))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDrop = (requestId: string, newStatus: string) => {
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    MaintenanceAPI.update(requestId, { status: toApiStatus(newStatus) as any }).catch(() => {});
  };

  const columns = [
    {
      title: "Open",
      status: "open",
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "In Progress",
      status: "in-progress",
      icon: Clock,
      color: "from-blue-500 to-cyan-600"
    },
    {
      title: "Completed",
      status: "completed",
      icon: CheckCircle2,
      color: "from-green-500 to-emerald-600"
    }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64 }}>
        <Loader2 size={28} color="#0A7A52" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            status={column.status}
            requests={requests.filter(req => req.status === column.status)}
            onDrop={handleDrop}
            icon={column.icon}
            color={column.color}
          />
        ))}
      </div>
    </DndProvider>
  );
}
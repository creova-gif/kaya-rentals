import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar, DollarSign, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { PaymentAPI } from "../services/backend.service";

interface Payment {
  id: string;
  tenant: string;
  unit: string;
  amount: number;
  dueDate: string;
  status: "paid" | "due-soon" | "overdue" | "upcoming" | "completed" | "pending" | "late";
  paidDate?: string;
}

const normalizeStatus = (s: string): Payment["status"] => {
  if (s === "completed") return "paid";
  if (s === "late") return "overdue";
  if (s === "pending") return "upcoming";
  return s as Payment["status"];
};

export function PaymentCalendar() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PaymentAPI.getAll()
      .then(raw => setPayments(
        raw.map((p: any) => ({
          id: p.id,
          tenant: p.tenantName ?? p.tenantId ?? "Tenant",
          unit: p.unitId ?? p.unit ?? "—",
          amount: p.amount ?? 0,
          dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split("T")[0] : "",
          status: normalizeStatus(p.status ?? "upcoming"),
          paidDate: p.paidDate ? new Date(p.paidDate).toISOString().split("T")[0] : undefined,
        }))
      ))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 64 }}>
        <Loader2 size={28} color="#0A7A52" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const statusConfig = {
    paid: {
      icon: CheckCircle2,
      bg: "bg-[#E5F4EE]",
      border: "border-[#0A7A52]/20",
      text: "text-[#0A7A52]",
      label: "Paid"
    },
    "due-soon": {
      icon: Clock,
      bg: "bg-[#FEF3E2]",
      border: "border-[#F59E0B]/20",
      text: "text-[#F59E0B]",
      label: "Due Soon"
    },
    overdue: {
      icon: AlertTriangle,
      bg: "bg-[#FEE2E2]",
      border: "border-[#EF4444]/20",
      text: "text-[#EF4444]",
      label: "Overdue"
    },
    upcoming: {
      icon: Calendar,
      bg: "bg-[#EFF6FF]",
      border: "border-[#3B82F6]/20",
      text: "text-[#3B82F6]",
      label: "Upcoming"
    }
  };

  const groupedPayments = {
    paid: payments.filter(p => p.status === "paid"),
    "due-soon": payments.filter(p => p.status === "due-soon"),
    overdue: payments.filter(p => p.status === "overdue"),
    upcoming: payments.filter(p => p.status === "upcoming")
  };

  const totalPaid = groupedPayments.paid.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = [...groupedPayments["due-soon"], ...groupedPayments.overdue].reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#0A7A52] to-[#0D9B68] rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="size-6" />
            <span className="text-[12px] text-white/80 uppercase tracking-wider">Collected</span>
          </div>
          <p className="text-[36px] font-normal text-white leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>${totalPaid.toLocaleString()}</p>
          <p className="text-[13px] text-white/80 mt-2">{groupedPayments.paid.length} payments</p>
        </div>

        <div className="bg-gradient-to-br from-[#F59E0B] to-[#F97316] rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="size-6" />
            <span className="text-[12px] text-white/80 uppercase tracking-wider">Outstanding</span>
          </div>
          <p className="text-[36px] font-normal text-white leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>${totalDue.toLocaleString()}</p>
          <p className="text-[13px] text-white/80 mt-2">
            {groupedPayments["due-soon"].length + groupedPayments.overdue.length} payments
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#3B82F6] to-[#6366F1] rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="size-6" />
            <span className="text-[12px] text-white/80 uppercase tracking-wider">Next Month</span>
          </div>
          <p className="text-[36px] font-normal text-white leading-none" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            ${groupedPayments.upcoming.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
          </p>
          <p className="text-[13px] text-white/80 mt-2">{groupedPayments.upcoming.length} payments expected</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.07)] p-6">
        <h3 className="text-[24px] font-normal text-[#0E0F0C] mb-6" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Payment Timeline</h3>
        
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[rgba(0,0,0,0.07)]" />

          <div className="space-y-6">
            {Object.entries(groupedPayments).map(([status, items]) => {
              if (items.length === 0) return null;
              
              const config = statusConfig[status as keyof typeof statusConfig];
              const Icon = config.icon;

              return (
                <div key={status}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`relative z-10 p-2 rounded-full ${config.bg} border-2 ${config.border}`}>
                      <Icon className={`size-5 ${config.text}`} />
                    </div>
                    <h4 className="text-[14px] font-semibold text-[#0E0F0C] uppercase tracking-wider">{config.label}</h4>
                  </div>

                  <div className="ml-16 space-y-3">
                    {items.map((payment, idx) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        className={`p-4 rounded-lg border ${config.border} ${config.bg} cursor-pointer hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-normal text-[16px] text-[#0E0F0C]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{payment.tenant}</p>
                              <p className="text-[13px] text-[#767570]">Unit {payment.unit}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-normal text-[#0E0F0C] text-[20px]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                              ${payment.amount.toLocaleString()}
                            </p>
                            <p className="text-[12px] text-[#767570]">
                              {payment.paidDate ? `Paid ${payment.paidDate}` : `Due ${payment.dueDate}`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Predictive Alert */}
      <div className="p-6 rounded-xl bg-[#FEF3E2] border border-[#F59E0B]/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#FED7AA]">
            <AlertTriangle className="size-5 text-[#F59E0B]" />
          </div>
          <div className="flex-1">
            <h3 className="font-normal text-[18px] text-[#0E0F0C] mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>AI Payment Prediction</h3>
            <p className="text-[14px] text-[#767570] mb-3">
              Based on historical data, there's a 78% probability that Lisa Park (Unit 1B) will pay late this month. 
              Consider sending a friendly reminder 3 days before the due date.
            </p>
            <button className="px-4 py-2 bg-[#0A7A52] hover:bg-[#096A46] text-white rounded-lg text-[13px] font-semibold transition-colors">
              Send Auto-Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
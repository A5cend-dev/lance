"use client";

import { LoaderCircle } from "lucide-react";
import { type Bid, type Job } from "@/lib/api";

interface AcceptBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bid: Bid | null;
  job: Job;
  isPending: boolean;
}

export function AcceptBidModal({
  isOpen,
  onClose,
  onConfirm,
  bid,
  job,
  isPending,
}: AcceptBidModalProps) {
  if (!isOpen || !bid) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/80 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="accept-bid-title"
        aria-describedby="accept-bid-description"
        className="w-full max-w-2xl rounded-[1.75rem] border border-white/10 bg-zinc-950/95 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Review & Accept
            </p>
            <h3 id="accept-bid-title" className="mt-2 text-2xl font-semibold text-zinc-50">
              Accept Freelancer Bid
            </h3>
            <p id="accept-bid-description" className="mt-2 max-w-2xl text-sm text-zinc-300">
              Review the freelancer&apos;s proposal and budget. Once accepted, you&apos;ll need to fund the job.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-100">Freelancer Address</span>
              <span className="font-mono text-xs text-zinc-400">{bid.freelancer_address}</span>
            </div>
            
            <div className="mb-3">
              <span className="text-sm font-medium text-zinc-100">Proposal</span>
              <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{bid.proposal}</p>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-100">Job Budget</span>
              <span className="text-lg font-semibold text-emerald-400">
                ${(job.budget_usdc / 10_000_000).toLocaleString()} USDC
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition duration-150 hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 active:translate-y-px disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition duration-150 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                "Confirm & Accept"
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
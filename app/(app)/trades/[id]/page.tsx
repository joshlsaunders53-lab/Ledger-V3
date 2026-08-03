import { TradeReviewView } from "@/features/trades/trade-review-view";

export default function TradeReviewPage({ params }: { params: { id: string } }) {
  return <TradeReviewView tradeId={params.id} />;
}

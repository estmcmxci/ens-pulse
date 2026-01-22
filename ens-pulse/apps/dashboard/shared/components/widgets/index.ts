// Widget base components
export {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
  WidgetFooter,
  WidgetActions,
  WidgetActionButton,
  EmptyWidgetCell,
} from "./Widget";

// Static widget implementations
export { PriceCard } from "./PriceCard";
export { ProposalCard } from "./ProposalCard";
export { TreasuryWidget, CompactTreasuryCard } from "./TreasuryWidget";

// Live data widgets (Tier 1 & 2)
export {
  // Tier 1: Live Data
  TotalTreasuryWidget,
  TreasuryGridWidget,
  PendingTxWidget,
  GasTrackerWidget,
  NewsFeedWidget,
  InfraStatusWidget,
  // Price Widgets
  PriceStatusBar,
  PriceTickerWidget,
  // Tier 2: Dune-Powered
  DelegateStatsWidget,
  RevenueWidget,
  RegistrationsWidget,
  GovernanceRiskWidget,
} from "./LiveWidgets";

// Protocol Health (ENS Node)
export { ProtocolHealthWidget } from "./ProtocolHealthWidget";

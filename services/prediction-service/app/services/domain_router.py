from collections.abc import Mapping
from types import MappingProxyType

from app.schemas.analysis import AnalysisServiceRequest, AnalysisServiceResponse
from app.schemas.domain import AnalysisDomain
from app.services.analysis_handlers import AnalysisHandler


class DomainRouter:
    def __init__(
        self,
        *,
        general_research_handler: AnalysisHandler,
        custom_dataset_handler: AnalysisHandler,
        sports_handler: AnalysisHandler,
        financial_market_handler: AnalysisHandler,
    ) -> None:
        handlers: dict[AnalysisDomain, AnalysisHandler] = {
            AnalysisDomain.GENERAL_RESEARCH: general_research_handler,
            AnalysisDomain.CUSTOM_DATASET: custom_dataset_handler,
            AnalysisDomain.SPORTS: sports_handler,
            AnalysisDomain.FINANCIAL_MARKET: financial_market_handler,
        }

        registered_domains = set(handlers)
        expected_domains = set(AnalysisDomain)

        if registered_domains != expected_domains:
            missing_domains = expected_domains - registered_domains
            unexpected_domains = registered_domains - expected_domains

            missing = sorted(domain.value for domain in missing_domains)
            unexpected = sorted(domain.value for domain in unexpected_domains)

            raise RuntimeError(
                "DomainRouter registration mismatch: "
                f"missing={missing}, unexpected={unexpected}"
            )

        self._handlers: Mapping[AnalysisDomain, AnalysisHandler] = MappingProxyType(
            handlers
        )

    async def route(
        self,
        request: AnalysisServiceRequest,
    ) -> AnalysisServiceResponse:
        try:
            handler = self._handlers[request.domain]
        except KeyError as exc:
            raise RuntimeError(
                f"No analysis handler registered for domain {request.domain!r}"
            ) from exc

        return await handler.process(request)

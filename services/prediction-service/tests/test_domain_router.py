import asyncio
from unittest.mock import AsyncMock

import pytest

from app.schemas.analysis import (
    AnalysisServiceRequest,
    AnalysisServiceResponse,
)
from app.schemas.domain import AnalysisDomain
from app.services.analysis_handlers import AnalysisHandler
from app.services.domain_router import DomainRouter


def _build_router() -> tuple[
    DomainRouter,
    dict[AnalysisDomain, AsyncMock],
]:
    handlers = {domain: AsyncMock(spec=AnalysisHandler) for domain in AnalysisDomain}

    router = DomainRouter(
        general_research_handler=handlers[AnalysisDomain.GENERAL_RESEARCH],
        custom_dataset_handler=handlers[AnalysisDomain.CUSTOM_DATASET],
        sports_handler=handlers[AnalysisDomain.SPORTS],
        financial_market_handler=handlers[AnalysisDomain.FINANCIAL_MARKET],
    )

    return router, handlers


@pytest.mark.parametrize(
    "domain",
    [
        AnalysisDomain.GENERAL_RESEARCH,
        AnalysisDomain.CUSTOM_DATASET,
        AnalysisDomain.SPORTS,
        AnalysisDomain.FINANCIAL_MARKET,
    ],
)
def test_route_invokes_only_the_handler_registered_for_domain(
    domain: AnalysisDomain,
) -> None:
    router, handlers = _build_router()
    request = AnalysisServiceRequest.model_construct(domain=domain)
    response = AnalysisServiceResponse.model_construct()

    selected_handler = handlers[domain]
    selected_handler.process.return_value = response

    result = asyncio.run(router.route(request))

    selected_handler.process.assert_awaited_once()

    await_arguments = selected_handler.process.await_args
    assert await_arguments is not None
    assert await_arguments.args[0] is request

    for registered_domain, handler in handlers.items():
        if registered_domain is not domain:
            handler.process.assert_not_awaited()

    total_handler_calls = sum(
        handler.process.await_count for handler in handlers.values()
    )

    assert total_handler_calls == 1
    assert result is response


def test_route_rejects_unmapped_domain_without_using_fallback() -> None:
    router, handlers = _build_router()

    request = AnalysisServiceRequest.model_construct(domain="UNMAPPED_DOMAIN")

    with pytest.raises(
        RuntimeError,
        match="No analysis handler registered for domain",
    ):
        asyncio.run(router.route(request))

    for handler in handlers.values():
        handler.process.assert_not_awaited()

    assert handlers[AnalysisDomain.GENERAL_RESEARCH].process.await_count == 0

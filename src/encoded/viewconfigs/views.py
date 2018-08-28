from pyramid.view import view_config
from snovault.viewconfigs.searchview import SearchView
from snovault.viewconfigs.report import ReportView
from encoded.viewconfigs.news import NewsView
from encoded.viewconfigs.matrix import MatrixView
from encoded.viewconfigs.auditview import AuditView
from encoded.viewconfigs.summary import SummaryView 
from encoded.helpers.helper import (View_Item, search_result_actions)

def includeme(config):
    config.add_route('search', '/search{slash:/?}')
    config.add_route('report', '/report{slash:/?}')
    config.add_route('matrix', '/matrix{slash:/?}')
    config.add_route('news', '/news/')
    config.add_route('audit', '/audit/')
    config.add_route('summary', '/summary{slash:/?}')
    config.scan(__name__)


def iter_search_results(context, request):
    return search(context, request, return_generator=True)


@view_config(route_name='search', request_method='GET', permission='search')
def search(context, request, search_type=None, return_generator=False):
    default_doc_types = [
        'AntibodyLot',
        'Award',
        'Biosample',
        'Dataset',
        'GeneticModification',
        'Page',
        'Pipeline',
        'Publication',
        'Software',
        'Target',
    ]
    search = SearchView(context, request, search_type, return_generator, default_doc_types)
    
    views = []
    view_item = View_Item(search.request, search.search_base)
    if len(search.doc_types) == 1:
        ti = search.types[search.doc_types[0]]
        views.append(view_item.tabular_report)

        if hasattr(ti.factory, 'matrix'):
            views.append(view_item.summary_matrix)

        if hasattr(ti.factory, 'summary_daya'):
            views.append(view_item.summary_report)
            
    return search.preprocess_view(views=views, search_result_actions=search_result_actions)


@view_config(route_name='report', request_method='GET', permission='search')
def report(context, request):

    report = ReportView(context, request)
    return report.preprocess_view()


@view_config(route_name='news', request_method='GET', permission='search')
def news(context, request):

    news = NewsView(context, request)
    return news.preprocess_view()


@view_config(route_name='matrix', request_method='GET', permission='search')
def matrix(context, request):

    matrix = MatrixView(context, request)
    return matrix.preprocess_view()


@view_config(route_name='audit', request_method='GET', permission='search')
def audit(context, request):

    audit = AuditView(context, request)
    return audit.preprocess_view()


@view_config(route_name='summary', request_method='GET', permission='search')
def summary(context, request):

    summary = SummaryView(context, request)
    return summary.preprocess_view()

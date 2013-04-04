import pytest

COLLECTION_URLS = [
    '/',
    '/antibodies/',
    '/targets/',
    '/organisms/',
    '/sources/',
    '/validations/',
    '/antibody-lots/',
    ]


@pytest.mark.parametrize('url', COLLECTION_URLS)
def test_html(htmltestapp, url):
    res = htmltestapp.get(url, status=200)
    assert res.body.startswith('<!DOCTYPE html>')


@pytest.mark.parametrize('url', COLLECTION_URLS)
def test_json(testapp, url):
    res = testapp.get(url, status=200)
    assert res.json['_links']


def _test_user_html(htmltestapp):
    ''' this test should return 403 forbidden but cannot currently load data
        via post_json with authz on.
    '''
    res = htmltestapp.get('/users/', status=403)


def _test_antibody_approval_creation(testapp):
    from urlparse import urlparse
    new_antibody = {'foo': 'bar'}
    res = testapp.post_json('/antibodies/', new_antibody, status=201)
    assert res.location
    assert res.json['_links']['profile'] == {'href': '/profiles/result'}
    assert res.json['_links']['items'] == [{'href': urlparse(res.location).path}]
    res = testapp.get(res.location, status=200)
    assert res.json['_links']['profile'] == {'href': '/profiles/antibody_approval'}
    data = dict(res.json)
    del data['_links']
    assert data == new_antibody
    res = testapp.get('/antibodies/', status=200)
    assert len(res.json['_links']['items']) == 1


def __test_sample_data(testapp):

    from .sample_data import test_load_all
    test_load_all(testapp)
    res = testapp.get('/biosamples/', headers={'Accept': 'application/json'}, status=200)
    assert len(res.json['_embedded']['items']) == 1
    res = testapp.get('/labs/', headers={'Accept': 'application/json'}, status=200)
    assert len(res.json['_embedded']['items']) == 2


@pytest.mark.slow
def test_load_workbook(testapp, collection_test):
    from ..loadxl import load_all
    from pkg_resources import resource_filename
    assert type(collection_test) == dict
    workbook = resource_filename('encoded', 'tests/data/test_encode3_interface_submissions.xlsx')
    docsdir = [resource_filename('encoded', 'tests/data/documents/')]
    from conftest import app_settings
    load_test_only = app_settings.get('load_test_only', False)
    assert load_test_only
    load_all(testapp, workbook, docsdir, test=load_test_only)
    for content_type, expect in collection_test.iteritems():
        url = '/' + content_type + '/'
        res = testapp.get(url, status=200)
        assert res.json['_links']['items']
        assert len(res.json['_links']['items']) == expect

    # test limit
    res = testapp.get('/antibodies/?limit=10', status=200)
    assert res.json['_links']['items']
    assert len(res.json['_links']['items']) == 10


@pytest.mark.parametrize('url', ['/organisms/', '/sources/', '/users/'])
def test_collection_post(testapp, url):
    from .sample_data import URL_COLLECTION
    collection = URL_COLLECTION[url]
    for item in collection:
        testapp.post_json(url, item, status=201)


@pytest.mark.parametrize('url', ['/organisms/', '/sources/'])
def test_collection_post_bad_json(testapp, url):
    collection = [{'foo': 'bar'}]
    for item in collection:
        res = testapp.post_json(url, item, status=422)
        assert res.json['errors']


@pytest.mark.parametrize('url', ['/organisms/', '/sources/'])
def test_collection_update(testapp, url, execute_counter):
    from .sample_data import URL_COLLECTION
    collection = URL_COLLECTION[url]
    initial = collection[0]
    res = testapp.post_json(url, initial, status=201)
    item_url = res.json['_links']['items'][0]['href']

    execute_counter.reset()
    res = testapp.get(item_url).json
    assert execute_counter.count == 1

    res.pop('_links', None)
    res.pop('_embedded', None)
    assert res == initial

    update = collection[1].copy()
    del update['_uuid']
    testapp.post_json(item_url, update, status=200)

    execute_counter.reset()
    res = testapp.get(item_url).json
    assert execute_counter.count == 1

    res.pop('_uuid', None)
    res.pop('_links', None)
    res.pop('_embedded', None)
    assert res == update


def test_users_post(testapp, session):
    from .sample_data import URL_COLLECTION
    from ..storage import UserMap
    from ..authorization import groupfinder
    url = '/users/'
    item = URL_COLLECTION[url][0]
    testapp.post_json(url, item, status=201)
    login = 'mailto:' + item['email']
    query = session.query(UserMap).filter(UserMap.login == login)
    user = query.one()
    assert user is not None
    principals = groupfinder(login, None)
    assert sorted(principals) == [
        'lab:2c334112-288e-4d45-9154-3f404c726daf',
        'userid:e9be360e-d1c7-4cae-9b3a-caf588e8bb6f',
        ]


# __acl__ check disabled as users are transcluded.
def __test_notfound_denied_anonymous(htmltestapp):
    htmltestapp.get('/users/badname', status=403)


def test_notfound_admin(testapp):
    testapp.get('/users/badname', status=404)

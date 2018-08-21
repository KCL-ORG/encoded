from snovault import (
    collection,
    load_schema,
    calculated_property
)
from .base import (
    Item,
)


@collection(
    name='carts',
    properties={
        'title': 'Cart',
        'description': 'Listing of cart contents',
    })
class Cart(Item):
    item_type = 'cart'
    schema = load_schema('encoded:schemas/cart.json')

    @calculated_property(schema={
        'title': 'Empty Items',
        'type': 'array'
        })
    def items(self, request):
        truncate = is_param_in_parent(request, 'truncate')
        if request.datastore == 'database' and truncate:
            return []


def is_param_in_parent(request, param):
    parent = request.__parent__
    print(parent)
    if parent:
        if parent.params.get(param, None):
            return True
        else:
            return is_param_in_parent(parent, param)
    else:
        return False
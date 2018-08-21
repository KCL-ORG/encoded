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
        if request.datastore == 'database':
            return ["test"]

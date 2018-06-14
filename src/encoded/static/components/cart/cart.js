// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelHeading, PanelBody, PanelFooter } from '../../libs/bootstrap/panel';
import CartSave from './save';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { requestSearch } from '../objectutils';
import { ResultTableList } from '../search';


// Called from <FetcheData> to render search results for all items in the current cart.
const CartSearchResults = ({ results, activeCart }) => (
    <ResultTableList results={results['@graph']} columns={results.columns} activeCart={activeCart} />
);

CartSearchResults.propTypes = {
    results: PropTypes.object, // Array of cart item objects from search
    activeCart: PropTypes.bool, // True if displaying an active cart
};

CartSearchResults.defaultProps = {
    results: {},
    activeCart: false,
};


// Renders the cart search results page. Display either:
// 1. Shared cart (/carts/<uuid>) containing a user's saved items
// 2. Active cart (/cart-view/) containing saved and in-memory items
class CartComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            cartSearchResults: {},
        };
        this.retrievingCartContents = false;
        this.retrieveCartContents = this.retrieveCartContents.bind(this);
        this.isRetrievingCartContents = this.isRetrievingCartContents.bind(this);
        this.setRetrievingCartContents = this.setRetrievingCartContents.bind(this);
    }

    componentDidMount() {
        // The cart only has object @ids, so first thing is to get search results for each of them.
        this.retrieveCartContents();
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Re-render if we got a response from a search request, which can show as a change in the
        // lengths of the search results in component state.
        const nextSearchItems = nextState.cartSearchResults['@graph'] || [];
        const currSearchItems = this.state.cartSearchResults['@graph'] || [];
        if (nextSearchItems.length !== currSearchItems.length) {
            return true;
        }

        // Rerender if the in-memory, shared, or saved cart lengths have changed.
        const nextSharedCart = nextProps.context.items || [];
        const currentSharedCart = this.props.context.items || [];
        const nextSavedCartItems = (nextProps.savedCartObj && nextProps.savedCartObj.items) || [];
        const currSavedCartItems = (this.props.savedCartObj && this.props.savedCartObj.items) || [];
        if ((nextProps.cart.length !== this.props.cart.length) ||
            (nextSharedCart.length !== currentSharedCart.length) ||
            (nextSavedCartItems.length !== currSavedCartItems.length)) {
            return true;
        }

        // Rerender if login cookie information changed
        const currCsfrt = this.props.session && this.props.session._csrft_;
        const nextCsfrt = nextProps.session && nextProps.session._csrft_;
        if (currCsfrt !== nextCsfrt) {
            return true;
        }

        // Rerender if user information changed, like if the user logged in or impersonated
        // someone.
        const currUser = !!(this.props.sessionProperties && this.props.sessionProperties.user);
        const nextUser = !!(nextProps.sessionProperties && nextProps.sessionProperties.user);
        if (currUser !== nextUser) {
            return true;
        }

        // Redraw if the in-memory, shared, or saved cart contents have changed.
        if (!_.isEqual(nextProps.cart, this.props.cart) ||
            !_.isEqual(nextSharedCart, currentSharedCart)) {
            return true;
        }

        // Nothing relevant to re-rendering has changed.
        return false;
    }

    componentDidUpdate() {
        // If the search result lengths changed, don't do anything additional on update because
        // that just means our search results returned, and they've been re-rendered already.
        // Otherwise we need to do the GET request for the @ids in the cart.
        if (!this.isRetrievingCartContents()) {
            this.retrieveCartContents();
        }
    }

    setRetrievingCartContents(setting) {
        this.retrievingCartContents = setting;
    }

    isRetrievingCartContents() {
        // Call to know whether we have an outstanding GET request for the cart contents search.
        return this.retrievingCartContents;
    }

    retrieveCartContents() {
        // Get search results for cart contents so it can be displayed as search results.
        const { context, cart, savedCartObj } = this.props;
        let cartItems = [];

        // Shared and active carts displayed slightly differently.
        const activeCart = context['@type'][0] === 'cart-view';

        // Retrieve active or shared cart item @ids and build a search query string out of them.
        if (activeCart) {
            // Combine in-memory and saved carts to show the active cart.
            cartItems = _.uniq(cart.concat((savedCartObj && savedCartObj.items) || []));
        } else {
            // Just show the saved cart contents for the shared cart.
            cartItems = context.items || [];
        }

        // Perform the search of cart contents if the cart isn't empty, which triggers a rendering
        // of these contents.
        if (cartItems.length > 0) {
            const cartQueryString = cartItems.map(cartItem => `${encodedURIComponent('@id')}=${encodedURIComponent(cartItem)}`).join('&');
            this.setRetrievingCartContents(true);
            requestSearch(cartQueryString).then((searchResults) => {
                this.setRetrievingCartContents(false);

                // We can get no search results, in which case `searchResults` is the empty object
                // which causes an empty cart render.
                this.setState({ cartSearchResults: searchResults });
            });
        } else {
            // Render an empty cart.
            this.setState({ cartSearchResults: {} });
        }
    }

    render() {
        const { context } = this.props;
        const { cartSearchResults } = this.state;
        let missingItems = [];
        const searchResults = (cartSearchResults && cartSearchResults['@graph']) || [];

        // Shared and active carts displayed slightly differently.
        const activeCart = context['@type'][0] === 'cart-view';

        // When viewing a shared cart, see if any searched items are missing for the current user's
        // permissions.
        if (!activeCart) {
            if (context.items.length - searchResults.length > 0) {
                missingItems = _.difference(context.items, searchResults.map(item => item['@id']));
            }
        }

        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
                <Panel>
                    {activeCart ?
                        <PanelHeading addClasses="cart__heading">
                            <div className="cart__loss-warning">
                                Any unsaved changes to the cart are lost if you reload any page.
                            </div>
                            <CartSave />
                        </PanelHeading>
                    : null}
                    <PanelBody addClasses="cart__result-table">
                        {searchResults.length > 0 ?
                            <CartSearchResults results={cartSearchResults} activeCart={activeCart} />
                        :
                            <p className="cart__empty-message">
                                Empty cart
                            </p>
                        }
                    </PanelBody>
                    {missingItems.length > 0 ?
                        <PanelFooter addClasses="cart__missing-items">
                            <p>The following items in this cart cannot be viewed with your viewing group:</p>
                            {missingItems.map(item => <div key={item} className="cart__missing-item">{item}</div>)}
                        </PanelFooter>
                    : null}
                </Panel>
            </div>
        );
    }
}

CartComponent.propTypes = {
    context: PropTypes.object.isRequired, // Cart object to display
    cart: PropTypes.array.isRequired, // In-memory cart contents
    savedCartObj: PropTypes.object, // Saved cart contents
    session: PropTypes.object, // App session info
    sessionProperties: PropTypes.object, // Login session info
};

CartComponent.defaultProps = {
    session: null,
    sessionProperties: null,
    savedCartObj: null,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    savedCartObj: state.savedCartObj,
    session: ownProps.session,
    sessionProperties: ownProps.sessionProperties,
});

const CartInternal = connect(mapStateToProps)(CartComponent);


// Called when a "Cart" object is requested to be rendered. This is a standard React component
// that's sort of a wrapper around <CartInternal> which is a Redux component. This lets us pass the
// encoded context properties as regular props to <CartIntenral>. Passing React context directly to
// a Redux component doesn't seem very reliable.
const Cart = (props, reactContext) => (
    <CartInternal context={props.context} session={reactContext.session} sessionProperties={reactContext.session_properties} />
);

Cart.propTypes = {
    context: PropTypes.object.isRequired, // Cart object to render
};

Cart.contextTypes = {
    session: PropTypes.object,
    session_properties: PropTypes.object,
};

contentViews.register(Cart, 'cart-view'); // /cart-view/ URI
contentViews.register(Cart, 'Cart'); // /carts/<uuid> URI

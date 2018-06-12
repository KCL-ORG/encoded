// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelHeading, PanelBody } from '../../libs/bootstrap/panel';
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
        this.retrieveCartContents = this.retrieveCartContents.bind(this);
    }

    componentDidMount() {
        // The cart only has object @ids, so first thing is to get search results for each of them.
        this.retrieveCartContents();
    }

    shouldComponentUpdate(nextProps, nextState) {
        // See if we got a response to our GET request. Just allow the cart to get
        // rendered with the new contents if that's the case.
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
            this.retrieveCartContents();
            return true;
        }

        // Rerender if login cookie information changed, usually caused by logging in or
        // impersonating.
        if (!_.isEqual(this.props.session, nextProps.session)) {
            this.retrieveCartContents();
            return true;
        }

        // Redraw if the in-memory, shared, or saved cart contents have changed.
        if (!_.isEqual(nextProps.cart, this.props.cart) ||
            !_.isEqual(nextSharedCart, currentSharedCart)) {
            this.retrieveCartContents();
            return true;
        }

        // Nothing relevant to re-rendering has changed.
        return false;
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
            requestSearch(cartQueryString).then((searchResults) => {
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
        const { context, session } = this.props;
        const loggedIn = !!(session && session['auth.userid']);

        // Shared and active carts displayed slightly differently.
        const activeCart = context['@type'][0] === 'cart-view';

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
                            {loggedIn ? <CartSave /> : null}
                        </PanelHeading>
                    : null}
                    <PanelBody addClasses="cart__result-table">
                        {Object.keys(this.state.cartSearchResults).length > 0 ?
                            <CartSearchResults results={this.state.cartSearchResults} activeCart={activeCart} />
                        :
                            <p className="cart__empty-message">
                                Empty cart
                            </p>
                        }
                    </PanelBody>
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
};

CartComponent.defaultProps = {
    session: null,
    savedCartObj: null,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    savedCartObj: state.savedCartObj,
    session: ownProps.session,
});

const CartInternal = connect(mapStateToProps)(CartComponent);


// Called when a "Cart" object is requested to be rendered. This is a standard React component
// that's sort of a wrapper around <CartInternal> which is a Redux component. This lets us pass the
// encoded context properties as regular props to <CartIntenral>. Passing React context directly to
// a Redux component doesn't seem very reliable.
const Cart = (props, reactContext) => (
    <CartInternal context={props.context} session={reactContext.session} />
);

Cart.propTypes = {
    context: PropTypes.object.isRequired, // Cart object to render
};

Cart.contextTypes = {
    session: PropTypes.object,
};

contentViews.register(Cart, 'cart-view'); // /cart-view/ URI
contentViews.register(Cart, 'Cart'); // /carts/<uuid> URI

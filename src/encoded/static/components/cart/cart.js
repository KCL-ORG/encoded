// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelBody } from '../../libs/bootstrap/panel';
import CartSave from './save';
import { FetchedData, Param } from '../fetched';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { ResultTableList } from '../search';


// Called from <FetcheData> to render search results for all items in the current cart.
const CartSearchResults = ({ results }) => (
    <ResultTableList results={results['@graph']} columns={results.columns} />
);

CartSearchResults.propTypes = {
    results: PropTypes.object, // encode search results
};

CartSearchResults.defaultProps = {
    results: null,
};


// Renders the cart search results page.
class CartComponent extends React.Component {
    shouldComponentUpdate(nextProps) {
        console.log('SCU %o\n%o', this.props, nextProps);
        const nextSavedCart = nextProps.context.items || [];
        const currentSavedCart = this.props.context.items || [];

        // Each render does a GET request, so we need to avoid them if possible.
        if ((nextProps.cart.length !== this.props.cart.length) ||
            (nextSavedCart.length !== currentSavedCart.length)) {
            return true;
        }
        return !_.isEqual(nextProps.cart, this.props.cart) || !_.isEqual(nextProps.context.items, this.props.context.items);
    }

    render() {
        const { context, cart, session } = this.props;
        let combinedCarts;
        let cartQueryString;

        // Combine in-memory and DB carts. We can have in-memory carts with different contents from
        // the DB cart, so have to consider both.
        const loggedIn = !!(session && session['auth.userid']);
        const hasCart = (context.items && context.items.length > 0) || cart.length > 0;
        if ((context.items && context.items.length > 0) || cart.length > 0) {
            combinedCarts = _.uniq(cart.concat(context.items || []));
            cartQueryString = combinedCarts.map(cartItem => `${encodedURIComponent('@id')}=${encodedURIComponent(cartItem)}`).join('&');
        }

        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
                {loggedIn ? <CartSave /> : null}
                <Panel>
                    <PanelBody addClasses="cart__result-table">
                        {hasCart ?
                            <div>
                                <p className="cart__loss-warning">
                                    Reloading any page while you have unsaved cart items removes those items from the cart.
                                </p>
                                <FetchedData>
                                    <Param name="results" url={`/search/?type=Experiment&${cartQueryString}`} />
                                    <CartSearchResults />
                                </FetchedData>
                            </div>
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
    session: PropTypes.object, // App session object
};

CartComponent.defaultProps = {
    session: null,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
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

// Respond to both the 'carts' object for /carts/ URI, and 'Cart' for /carts/<uuid> URI.
contentViews.register(Cart, 'carts');
contentViews.register(Cart, 'Cart');

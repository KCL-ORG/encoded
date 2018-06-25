// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelBody, PanelFooter, TabPanel, TabPanelPane } from '../../libs/bootstrap/panel';
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


const FileSearchResults = ({ results }) => (
    <ResultTableList results={results['@graph']} columns={results.columns} />
);

FileSearchResults.propTypes = {
    results: PropTypes.object, // Array of cart item objects from search
};

FileSearchResults.defaultProps = {
    results: {},
};


// Renders the cart search results page. Display either:
// 1. Shared cart (/carts/<uuid>) containing a user's saved items
// 2. Active cart (/cart-view/) containing saved and in-memory items
class CartComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            cartSearchResults: {}, // Receives cart search result object
            cartFileResults: {}, // All files in all carted datasets
            searchInProgress: false, // True if a search request is in progress
        };
        this.retrieveCartContents = this.retrieveCartContents.bind(this);
    }

    componentDidMount() {
        // The cart only has object @ids, so first thing is to get search results for each of them.
        this.retrieveCartContents();
    }

    shouldComponentUpdate(nextProps, nextState) {
        // If the spinner should be shown or hidden, force a rerender.
        if (this.state.searchInProgress !== nextState.searchInProgress) {
            return true;
        }

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

    componentDidUpdate(prevProps, prevState) {
        // Re-render if we got a response from a search request, which can show as a change in the
        // lengths of the search results in component state.
        const prevSearchItems = prevState.cartSearchResults['@graph'] || [];
        const currSearchItems = this.state.cartSearchResults['@graph'] || [];
        if (prevSearchItems.length === currSearchItems.length && prevState.searchInProgress === this.state.searchInProgress) {
            this.retrieveCartContents();
        }
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
            this.setState({ searchInProgress: true });
            requestSearch(cartQueryString).then((searchResults) => {
                // We can get no search results, in which case `searchResults` is the empty object
                // which causes an empty cart render.
                this.setState({
                    cartSearchResults: searchResults,
                    searchInProgress: false,
                });

                // Gather all the files in all the returned datasets and do a search on them.
                if (searchResults['@graph'] && searchResults['@graph'].length > 0) {
                    const allDatasetFiles = [];
                    searchResults['@graph'].forEach((dataset) => {
                        if (dataset.files && dataset.files.length > 0) {
                            allDatasetFiles.push(...dataset.files.map(file => file['@id']));
                        }
                    });
                    if (allDatasetFiles.length > 0) {
                        const fileQueryString = allDatasetFiles.map(file => `${encodedURIComponent('@id')}=${encodedURIComponent(file)}`).join('&');
                        return requestSearch(`type=File&${fileQueryString}`);
                    }
                }
                return Promise.resolve(null);
            }).then((fileResults) => {
                if (fileResults && fileResults['@graph'] && fileResults['@graph'].length > 0) {
                    this.setState({ cartFileResults: fileResults });
                }
                return Promise.resolve(fileResults);
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
                <Panel addClasses="cart__result-table">
                    {this.state.searchInProgress ?
                        <div className="communicating">
                            <div className="loading-spinner" />
                        </div>
                    : null}
                    <TabPanel tabs={{ datasets: 'Datasets', files: 'Files ' }}>
                        <TabPanelPane key="datasets">
                            <PanelBody>
                                {searchResults.length > 0 ?
                                    <CartSearchResults results={cartSearchResults} activeCart={activeCart} />
                                :
                                    <p className="cart__empty-message">
                                        Empty cart
                                    </p>
                                }
                            </PanelBody>
                        </TabPanelPane>
                        <TabPanelPane key="files">
                            <PanelBody>
                                {this.state.cartFileResults['@graph'] && this.state.cartFileResults['@graph'].length > 0 ?
                                    <FileSearchResults results={this.state.cartFileResults} />
                                :
                                    <p className="cart__empty-message">
                                        Empty cart
                                    </p>
                                }
                            </PanelBody>
                        </TabPanelPane>
                    </TabPanel>
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

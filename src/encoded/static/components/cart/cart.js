// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import { Panel, PanelBody, PanelFooter, TabPanel, TabPanelPane } from '../../libs/bootstrap/panel';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { requestSearch, requestObjects } from '../objectutils';
import { ResultTableList, BatchDownload } from '../search';
import CartClear from './clear';
import CartMergeShared from './merge_shared';


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


// Display one item of the File Format facet.
class FileFormatItem extends React.Component {
    constructor() {
        super();
        this.handleFormatSelect = this.handleFormatSelect.bind(this);
    }

    handleFormatSelect() {
        this.props.formatSelectHandler(this.props.format);
    }

    render() {
        const { format, termCount, totalTermCount, selected } = this.props;
        const barStyle = {
            width: `${Math.ceil((termCount / totalTermCount) * 100)}%`,
        };
        return (
            <li className={`facet-term${selected ? ' selected' : ''}`}>
                <button onClick={this.handleFormatSelect} aria-label={`${format} with count ${termCount}`}>
                    <div className="facet-term__item">
                        <div className="facet-term__text"><span>{format}</span></div>
                        <div className="facet-term__count">
                            {termCount}
                        </div>
                        <div className="facet-term__bar" style={barStyle} />
                    </div>
                </button>
            </li>
        );
    }
}

FileFormatItem.propTypes = {
    format: PropTypes.string.isRequired, // File format this button displays
    termCount: PropTypes.number.isRequired, // Number of files matching this item's format
    totalTermCount: PropTypes.number.isRequired, // Total number of files in the item's facet
    selected: PropTypes.bool, // True if this term should appear selected
    formatSelectHandler: PropTypes.func.isRequired, // Callback for handling clicks in a file format button
};

FileFormatItem.defaultProps = {
    selected: false,
};


const FileFormatFacet = ({ files, selectedFormats, formatSelectHandler }) => {
    // Get and sort by count (with file_format as second sorting key) the file_format of
    // everything in `files`.
    const filesByFormat = _.groupBy(files, 'file_format');
    const formats = Object.keys(filesByFormat).sort((formatA, formatB) => {
        const aLower = formatA.toLowerCase();
        const bLower = formatB.toLowerCase();
        return (aLower > bLower) ? 1 : ((aLower < bLower) ? -1 : 0);
    }).sort((formatA, formatB) => filesByFormat[formatB].length - filesByFormat[formatA].length);

    return (
        <div className="cart-files__facet box facets">
            <div className="facet">
                <h5>File format</h5>
                <ul className="facet-list nav">
                    {formats.map((format) => {
                        const termCount = filesByFormat[format].length;
                        return (
                            <div key={format}>
                                <FileFormatItem
                                    format={format}
                                    termCount={termCount}
                                    totalTermCount={files.length}
                                    selected={selectedFormats.indexOf(format) > -1}
                                    formatSelectHandler={formatSelectHandler}
                                />
                            </div>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

FileFormatFacet.propTypes = {
    files: PropTypes.array.isRequired, // Array of files whose facets we display
    selectedFormats: PropTypes.array, // Array of file formats to include in rendered lists, or [] to render all
    formatSelectHandler: PropTypes.func.isRequired, // Callback when the user clicks on a file format facet item
};

FileFormatFacet.defaultProps = {
    selectedFormats: [],
};


// Display pane displaying a list of files.
const FileSearchResults = ({ results, selectedFormats, formatSelectHandler }) => {
    // Filter file results by what's in selectedFormats.
    let filteredFiles = results;
    if (selectedFormats.length) {
        filteredFiles = results.filter(file => selectedFormats.indexOf(file.file_format) !== -1);
    }

    return (
        <div className="cart-files">
            <FileFormatFacet files={results} selectedFormats={selectedFormats} formatSelectHandler={formatSelectHandler} />
            <div className="cart-files__result-table">
                <ResultTableList results={filteredFiles} />
            </div>
        </div>
    );
};

FileSearchResults.propTypes = {
    results: PropTypes.array, // Array of cart item objects from search
    selectedFormats: PropTypes.array, // Array of selected file formats
    formatSelectHandler: PropTypes.func.isRequired, // Function to call when user selects/deselects a file format
};

FileSearchResults.defaultProps = {
    results: {},
    selectedFormats: [],
};


// Display controls in the tab area of the cart view.
const CartControls = ({ cartSearchResults, sharedCart }) => {
    const batchDownloadControl = Object.keys(cartSearchResults).length > 0 ? <BatchDownload context={cartSearchResults} /> : null;

    return (
        <span>
            {batchDownloadControl}
            <CartMergeShared sharedCartObj={sharedCart} />
            <CartClear />
        </span>
    );
};

CartControls.propTypes = {
    cartSearchResults: PropTypes.object, // Search result object for current cart contents
    sharedCart: PropTypes.object, // Items in the shared cart, if that's being displayed
};

CartControls.defaultProps = {
    cartSearchResults: {},
    sharedCart: null,
};


// Renders the cart search results page. Display either:
// 1. Shared cart (/carts/<uuid>) containing a user's saved items
// 2. Active cart (/cart-view/) containing saved and in-memory items
class CartComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            cartSearchResults: {}, // Cart dataset search result object
            cartFileResults: [], // All files in all carted datasets
            searchInProgress: false, // True if a search request is in progress
            selectedFormats: [], // Files formats selected to be included in results; all formats if empty array
        };
        this.handleFormatSelect = this.handleFormatSelect.bind(this);
        this.retrieveCartContents = this.retrieveCartContents.bind(this);
    }

    componentDidMount() {
        // The cart only has object @ids, so first thing is to get search results for each of them
        // as well as all their file objects.
        this.retrieveCartContents();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.cart.length !== this.props.cart.length || !_.isEqual(prevProps.cart, this.props.cart)) {
            this.retrieveCartContents();
        }
    }

    handleFormatSelect(format) {
        // The given file format was selected or deselected in the facet.
        const matchingIndex = this.state.selectedFormats.indexOf(format);
        if (matchingIndex === -1) {
            // Selected file format not in the list of included formats, so add it.
            this.setState(prevState => ({
                selectedFormats: prevState.selectedFormats.concat([format]),
            }));
        } else {
            // Selected file format is in the list of included formats, so remove it.
            this.setState(prevState => ({
                selectedFormats: prevState.selectedFormats.filter(includedFormat => includedFormat !== format),
            }));
        }
    }

    retrieveCartContents() {
        // Perform search for cart contents so it can be displayed as search results.
        const { context, cart } = this.props;
        let cartItems = [];
        let datasetResults = {};

        // Retrieve active or shared cart item @ids.
        if (context['@type'][0] === 'cart-view') {
            // Show in-memory cart for active cart display.
            cartItems = cart;
        } else {
            // Show the cart object contents for the shared cart.
            cartItems = context.items || [];
        }

        // Perform the search of cart contents if the cart isn't empty, which triggers a rendering
        // of these contents.
        if (cartItems.length > 0) {
            const experimentTypeQuery = cartItems.every(cartItem => cartItem.match(/^\/experiments\/.*?\/$/) !== null);
            const cartQueryString = `${experimentTypeQuery ? 'type=Experiment&' : ''}${cartItems.map(cartItem => `${encodedURIComponent('@id')}=${encodedURIComponent(cartItem)}`).join('&')}`;
            this.setState({ searchInProgress: true });
            requestSearch(cartQueryString).then((searchResults) => {
                datasetResults = searchResults;

                // Gather all the files in all the returned datasets and do a search on them.
                if (datasetResults['@graph'] && datasetResults['@graph'].length > 0) {
                    const allDatasetFiles = [];
                    datasetResults['@graph'].forEach((dataset) => {
                        if (dataset.files && dataset.files.length > 0) {
                            allDatasetFiles.push(...dataset.files.map(file => file['@id']));
                        }
                    });
                    if (allDatasetFiles.length > 0) {
                        return requestObjects(allDatasetFiles, '/search/?type=File&limit=all');
                    }
                }
                return null;
            }).then((fileResults) => {
                // All files in all datasets retrieved as array of file @ids in `fileResults`.
                const filteredFileResults = fileResults.filter(file => !file.restricted && (this.state.selectedFormats.length === 0 || this.state.selectedFormats.indexOf(file.file_format)));
                this.setState({ cartSearchResults: datasetResults, cartFileResults: filteredFileResults, searchInProgress: false });
                return fileResults;
            });
        } else {
            // Render an empty cart.
            this.setState({ cartSearchResults: {}, cartFileResults: [], searchInProgress: false });
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
                    <TabPanel
                        tabs={{ datasets: 'Datasets', files: 'Files ' }}
                        decoration={<CartControls cartSearchResults={this.state.cartSearchResults} sharedCart={context} />}
                        decorationClasses="cart-controls"
                    >
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
                                {this.state.cartFileResults && this.state.cartFileResults.length > 0 ?
                                    <FileSearchResults results={this.state.cartFileResults} selectedFormats={this.state.selectedFormats} formatSelectHandler={this.handleFormatSelect} />
                                :
                                    <p className="cart__empty-message">
                                        No relevant files
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

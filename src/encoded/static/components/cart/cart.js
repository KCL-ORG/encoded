// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import Pager from '../../libs/bootstrap/pager';
import { Panel, PanelBody, PanelFooter, TabPanel, TabPanelPane } from '../../libs/bootstrap/panel';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { requestSearch, requestObjects } from '../objectutils';
import { ResultTableList, BatchDownload } from '../search';
import CartClear from './clear';
import CartMergeShared from './merge_shared';


/** Number of dataset items to display per page */
const PAGE_DATASET_COUNT = 25;
/** Number of file items to display per page */
const PAGE_FILE_COUNT = 25;


/**
 * Called from <FetcheData> to render search results for all items in the current cart.
 */
const CartSearchResults = ({ items, currentPage, activeCart }) => {
    let pagedItems;
    if (items.length > PAGE_DATASET_COUNT) {
        const pageFirstIndex = currentPage * PAGE_DATASET_COUNT;
        pagedItems = items.slice(pageFirstIndex, pageFirstIndex + PAGE_DATASET_COUNT);
    } else {
        pagedItems = items;
    }
    return <ResultTableList results={pagedItems} activeCart={activeCart} />;
};

CartSearchResults.propTypes = {
    /** Array of cart item objects from search */
    items: PropTypes.array,
    /** Page of results to display */
    currentPage: PropTypes.number,
    /** True if displaying an active cart */
    activeCart: PropTypes.bool,
};

CartSearchResults.defaultProps = {
    items: [],
    currentPage: 0,
    activeCart: false,
};


/**
 * Display one item of the File Format facet.
 */
class FileFormatItem extends React.Component {
    constructor() {
        super();
        this.handleFormatSelect = this.handleFormatSelect.bind(this);
    }

    /**
     * Called when a file format is selected from the facet.
     */
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
    /** File format this button displays */
    format: PropTypes.string.isRequired,
    /** Number of files matching this item's format */
    termCount: PropTypes.number.isRequired,
    /** Total number of files in the item's facet */
    totalTermCount: PropTypes.number.isRequired,
    /** True if this term should appear selected */
    selected: PropTypes.bool,
    /** Callback for handling clicks in a file format button */
    formatSelectHandler: PropTypes.func.isRequired,
};

FileFormatItem.defaultProps = {
    selected: false,
};


/**
 * Display the file format facet.
 */
const FileFormatFacet = ({ fileFormats, totalFileCount, selectedFormats, formatSelectHandler }) => {
    return (
        <div className="cart-files__facet box facets">
            <div className="facet">
                <h5>File format</h5>
                <ul className="facet-list nav">
                    {fileFormats.map((formatAndCount) => {
                        const termCount = formatAndCount.count;
                        return (
                            <div key={formatAndCount.format}>
                                <FileFormatItem
                                    format={formatAndCount.format}
                                    termCount={termCount}
                                    totalTermCount={totalFileCount}
                                    selected={selectedFormats.indexOf(formatAndCount.format) > -1}
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
    /** Array of all file formats and their counts [{format: 'format', count: number}, ...] */
    fileFormats: PropTypes.array.isRequired,
    /** Total number of files collected, displayed or not */
    totalFileCount: PropTypes.number.isRequired,
    /** Array of file formats to include in rendered lists, or [] to render all */
    selectedFormats: PropTypes.array,
    /** Callback when the user clicks on a file format facet item */
    formatSelectHandler: PropTypes.func.isRequired,
};

FileFormatFacet.defaultProps = {
    selectedFormats: [],
};


/**
 *  Display a tabbed pane displaying a list of files.
 */
const FileSearchResults = ({ items, currentPage, fileFormats, selectedFormats, formatSelectHandler }) => {
    let files = items;
    if (files.length > PAGE_FILE_COUNT) {
        const pageFirstIndex = currentPage * PAGE_FILE_COUNT;
        files = files.slice(pageFirstIndex, pageFirstIndex + PAGE_FILE_COUNT);
    }

    return (
        <div className="cart-files">
            <FileFormatFacet fileFormats={fileFormats} selectedFormats={selectedFormats} totalFileCount={items.length} formatSelectHandler={formatSelectHandler} />
            <div className="cart-files__result-table">
                <ResultTableList results={files} />
            </div>
        </div>
    );
};

FileSearchResults.propTypes = {
    /** Array of cart item objects from search */
    items: PropTypes.array,
    /** Page of results to display */
    currentPage: PropTypes.number.isRequired,
    /** Array of all file formats and their counts [{format: 'format', count: number}, ...] */
    fileFormats: PropTypes.array.isRequired,
    /** Array of selected file formats */
    selectedFormats: PropTypes.array,
    /** Function to call when user selects/deselects a file format */
    formatSelectHandler: PropTypes.func.isRequired,
};

FileSearchResults.defaultProps = {
    items: [],
    selectedFormats: [],
};


/**
 * Display controls in the tab area of the cart view.
 */
const CartControls = ({ cartSearchResults, selectedFormats, sharedCart }) => {
    let batchDownloadControl;
    if (selectedFormats.length === 0) {
        batchDownloadControl = Object.keys(cartSearchResults).length > 0 ? <BatchDownload context={cartSearchResults} /> : null;
    } else {
        const query = `${cartSearchResults['@id']}&${selectedFormats.map(format => `files.file_type=${encodedURIComponent(format)}`).join('&')}`.substr(9);
        batchDownloadControl = <BatchDownload query={query} />;
    }

    return (
        <span>
            {batchDownloadControl}
            <CartMergeShared sharedCartObj={sharedCart} />
            <CartClear />
        </span>
    );
};

CartControls.propTypes = {
    /** Search result object for current cart contents */
    cartSearchResults: PropTypes.object,
    /** Selected file formats */
    selectedFormats: PropTypes.array,
    /** Items in the shared cart, if that's being displayed */
    sharedCart: PropTypes.object,
};

CartControls.defaultProps = {
    cartSearchResults: {},
    selectedFormats: [],
    sharedCart: null,
};


/**
 * Display the total number of cart items.
 */
const ItemCountArea = ({ itemCount, itemName, itemNamePlural }) => {
    if (itemCount > 0) {
        return (
            <div className="cart__item-count">
                {itemCount}&nbsp;{itemCount === 1 ? itemName : itemNamePlural}
            </div>
        );
    }
    return null;
};

ItemCountArea.propTypes = {
    itemCount: PropTypes.number.isRequired, // Number of items in cart display
    itemName: PropTypes.string.isRequired, // Singular name of item being displayed
    itemNamePlural: PropTypes.string.isRequired, // Plural name of item being displayed
};


/**
 * Display the pager control area at the bottom of the dataset and file search result panels.
 */
const PagerArea = ({ currentPage, totalPageCount, updateCurrentPage }) => {
    if (totalPageCount > 1) {
        return (
            <div className="cart__pager">
                <Pager total={totalPageCount} current={currentPage} updateCurrentPage={updateCurrentPage} />
            </div>
        );
    }
    return null;
};

PagerArea.propTypes = {
    /** Zero-based current page to display */
    currentPage: PropTypes.number.isRequired,
    /** Total number of pages */
    totalPageCount: PropTypes.number.isRequired,
    /** Called when user clicks pager controls */
    updateCurrentPage: PropTypes.func.isRequired,
};


/**
 * Renders the cart search results page. Display either:
 * 1. Shared cart (/carts/<uuid>) containing a user's saved items
 * 2. Active cart (/cart-view/) containing saved and in-memory items
 */
class CartComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            /** Cart dataset search result object */
            cartSearchResults: {},
            /** All files in all carted datasets */
            cartFileResults: [],
            /** True if a search request is in progress */
            searchInProgress: false,
            /** Files formats selected to be included in results; all formats if empty array */
            selectedFormats: [],
            /** Currently displayed page of dataset search results */
            currentDatasetResultsPage: 0,
            /** Currently displayed page of file search results */
            currentFileResultsPage: 0,
        };
        this.handleFormatSelect = this.handleFormatSelect.bind(this);
        this.retrieveCartContents = this.retrieveCartContents.bind(this);
        this.updateDatasetCurrentPage = this.updateDatasetCurrentPage.bind(this);
        this.updateFileCurrentPage = this.updateFileCurrentPage.bind(this);
    }

    componentDidMount() {
        // The cart only has object @ids, so first thing is to get search results for each of them
        // as well as all their file objects.
        this.retrieveCartContents();
    }

    componentDidUpdate(prevProps) {
        // Only request new file objects from search if the cart contents have changed.
        if (prevProps.cart.length !== this.props.cart.length || !_.isEqual(prevProps.cart, this.props.cart)) {
            this.retrieveCartContents();
        }
    }

    /**
     * Called when the given file format was selected or deselected in the facet.
     * @param {string} format File format facet item that was clicked
     */
    handleFormatSelect(format) {
        const matchingIndex = this.state.selectedFormats.indexOf(format);
        if (matchingIndex === -1) {
            // Selected file format not in the list of included formats, so add it.
            this.setState(prevState => ({
                selectedFormats: prevState.selectedFormats.concat([format]),
                currentFileResultsPage: 0,
            }));
        } else {
            // Selected file format is in the list of included formats, so remove it.
            this.setState(prevState => ({
                selectedFormats: prevState.selectedFormats.filter(includedFormat => includedFormat !== format),
                currentFileResultsPage: 0,
            }));
        }
    }

    /**
     * Perform search for cart contents so it can be displayed as search results.
     */
    retrieveCartContents() {
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
            const cartQueryString = `${experimentTypeQuery ? 'type=Experiment&' : ''}${cartItems.map(cartItem => `${encodedURIComponent('@id')}=${encodedURIComponent(cartItem)}`).join('&')}&limit=all`;
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
                if (datasetResults && datasetResults['@graph'].length) {
                    this.setState({ cartSearchResults: datasetResults });
                }
                if (fileResults) {
                    // All files in all datasets retrieved as array of file @ids in `fileResults`.
                    const filteredFileResults = fileResults.filter(file => !file.restricted && (this.state.selectedFormats.length === 0 || this.state.selectedFormats.indexOf(file.file_format)));
                    this.setState({ cartFileResults: filteredFileResults });
                }
                this.setState({ searchInProgress: false });
                return fileResults;
            });
        } else {
            // Render an empty cart.
            this.setState({ cartSearchResults: {}, cartFileResults: [], searchInProgress: false });
        }
    }

    updateDatasetCurrentPage(newCurrent) {
        this.setState({ currentDatasetResultsPage: newCurrent });
    }

    updateFileCurrentPage(newCurrent) {
        this.setState({ currentFileResultsPage: newCurrent });
    }

    render() {
        const { context } = this.props;
        const { cartSearchResults } = this.state;
        let missingItems = [];
        const datasets = (cartSearchResults && cartSearchResults['@graph']) || [];
        const totalDatasetPages = Math.floor(datasets.length / PAGE_DATASET_COUNT) + (datasets.length % PAGE_DATASET_COUNT !== 0 ? 1 : 0);

        // Shared and active carts displayed slightly differently.
        const activeCart = context['@type'][0] === 'cart-view';

        // When viewing a shared cart, see if any searched items are missing for the current user's
        // permissions.
        if (!activeCart) {
            if (context.items.length - datasets.length > 0) {
                missingItems = _.difference(context.items, datasets.map(item => item['@id']));
            }
        }

        // Filter files by the selected facets.
        let filteredFiles = this.state.cartFileResults;
        if (this.state.selectedFormats.length) {
            filteredFiles = filteredFiles.filter(file => this.state.selectedFormats.indexOf(file.file_format) !== -1);
        }
        const totalFilePages = Math.floor(filteredFiles.length / PAGE_FILE_COUNT) + (filteredFiles.length % PAGE_FILE_COUNT !== 0 ? 1 : 0);

        // Get and sort by count (with file_format as second sorting key) the file_format of
        // every file whose format is selected or not, for facet display.
        const filesByFormat = _.groupBy(this.state.cartFileResults, 'file_format');
        const fileFormats = Object.keys(filesByFormat).sort((formatA, formatB) => {
            const aLower = formatA.toLowerCase();
            const bLower = formatB.toLowerCase();
            return (aLower > bLower) ? 1 : ((aLower < bLower) ? -1 : 0);
        }).sort((formatA, formatB) => filesByFormat[formatB].length - filesByFormat[formatA].length).map(format => ({ format, count: filesByFormat[format].length }));

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
                        decoration={<CartControls cartSearchResults={cartSearchResults} selectedFormats={this.state.selectedFormats} sharedCart={context} />}
                        decorationClasses="cart-controls"
                    >
                        <TabPanelPane key="datasets">
                            <ItemCountArea itemCount={datasets.length} itemName="dataset" itemNamePlural="datasets" />
                            <PagerArea currentPage={this.state.currentDatasetResultsPage} totalPageCount={totalDatasetPages} updateCurrentPage={this.updateDatasetCurrentPage} />
                            <PanelBody>
                                {datasets.length > 0 ?
                                    <CartSearchResults items={datasets} currentPage={this.state.currentDatasetResultsPage} activeCart={activeCart} />
                                :
                                    <p className="cart__empty-message">
                                        Empty cart
                                    </p>
                                }
                            </PanelBody>
                        </TabPanelPane>
                        <TabPanelPane key="files">
                            <ItemCountArea itemCount={filteredFiles.length} itemName="file" itemNamePlural="files" />
                            <PagerArea currentPage={this.state.currentFileResultsPage} totalPageCount={totalFilePages} updateCurrentPage={this.updateFileCurrentPage} />
                            <PanelBody>
                                {filteredFiles.length > 0 ?
                                    <FileSearchResults items={filteredFiles} currentPage={this.state.currentFileResultsPage} fileFormats={fileFormats} selectedFormats={this.state.selectedFormats} formatSelectHandler={this.handleFormatSelect} />
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
    /** Cart object to display */
    context: PropTypes.object.isRequired,
    /** In-memory cart contents */
    cart: PropTypes.array.isRequired,
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    context: ownProps.context,
});

const Cart = connect(mapStateToProps)(CartComponent);


contentViews.register(Cart, 'cart-view'); // /cart-view/ URI
contentViews.register(Cart, 'Cart'); // /carts/<uuid> URI

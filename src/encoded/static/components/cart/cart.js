// Components for rendering the /carts/ page.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'underscore';
import Pager from '../../libs/bootstrap/pager';
import { Panel, PanelBody, PanelHeading } from '../../libs/bootstrap/panel';
import { contentViews, itemClass, encodedURIComponent } from '../globals';
import { requestObjects } from '../objectutils';
import { ResultTableList, BatchDownloadModal } from '../search';
import CartClear from './clear';
import CartMergeShared from './merge_shared';


/** Number of dataset items to display per page */
const PAGE_ITEM_COUNT = 25;
/** File facet fields to display */
const displayedFacetFields = [
    'file_format',
    'output_type',
    'file_type',
];


/**
 * Display a page of cart contents in the appearance of search results.
 */
class CartSearchResults extends React.Component {
    constructor() {
        super();
        this.state = {
            /** Carted items to display as search results; includes one page of search results */
            displayItems: [],
        };
        this.retrievePageItems = this.retrievePageItems.bind(this);
    }

    componentDidMount() {
        this.retrievePageItems();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.currentPage !== this.props.currentPage || !_.isEqual(prevProps.items, this.props.items)) {
            this.retrievePageItems();
        }
    }

    /**
     * Given the whole cart items as a list of @ids as well as the currently displayed page of cart
     * contents, perform a search of a page of items.
     */
    retrievePageItems() {
        const pageStartIndex = this.props.currentPage * PAGE_ITEM_COUNT;
        const currentPageItems = this.props.items.slice(pageStartIndex, pageStartIndex + PAGE_ITEM_COUNT);
        const experimentTypeQuery = this.props.items.every(item => item.match(/^\/experiments\/.*?\/$/) !== null);
        const cartQueryString = `/search/?limit=all${experimentTypeQuery ? '&type=Experiment' : ''}`;
        requestObjects(currentPageItems, cartQueryString).then((searchResults) => {
            this.setState({ displayItems: searchResults });
        });
    }

    render() {
        return <ResultTableList results={this.state.displayItems} activeCart={this.props.activeCart} />;
    }
}

CartSearchResults.propTypes = {
    /** Array of cart item @ids */
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
class FacetTerm extends React.Component {
    constructor() {
        super();
        this.handleTermSelect = this.handleTermSelect.bind(this);
    }

    /**
     * Called when a file format is selected from the facet.
     */
    handleTermSelect() {
        this.props.termSelectHandler(this.props.term);
    }

    render() {
        const { term, termCount, totalTermCount, selected } = this.props;
        const barStyle = {
            width: `${Math.ceil((termCount / totalTermCount) * 100)}%`,
        };
        return (
            <li className={`facet-term${selected ? ' selected' : ''}`}>
                <button onClick={this.handleTermSelect} aria-label={`${term} with count ${termCount}`}>
                    <div className="facet-term__item">
                        <div className="facet-term__text"><span>{term}</span></div>
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

FacetTerm.propTypes = {
    /** Displayed facet item */
    term: PropTypes.string.isRequired,
    /** Displayed number of files for this item */
    termCount: PropTypes.number.isRequired,
    /** Total number of files in the item's facet */
    totalTermCount: PropTypes.number.isRequired,
    /** True if this term should appear selected */
    selected: PropTypes.bool,
    /** Callback for handling clicks in the item's button */
    termSelectHandler: PropTypes.func.isRequired,
};

FacetTerm.defaultProps = {
    selected: false,
};


/**
 * Request a search of files whose datasets match those in `items`.
 * @param {array} items `@id`s of file datasets to request for a facet
 * @param {func} fetch System fetch function
 * @return {object} Promise with search result object
 */
const requestFacet = (items, fetch) => (
    fetch('/search_items/type=File&restricted!=true&limit=0&filterresponse=off', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            dataset: items,
        }),
    }).then(response => (
        response.ok ? response.json() : null
    ))
);


/**
 * Adds facet term counts and totals from facets of a search result object to the corresponding
 * `accumulatedResults` facet objects.
 * @param {object} accumulatedResults Mutated search results object that gets its facet term counts
 *                                    updated.
 * @param {object} currentResults Search results object to add to `accumulatedResults`.
 * @param {array} facetFields Facet field values whose term counts are to be added to
 *                            `accumulatedResults`.
 * @param {object} cachedAccumulatedFacets Saved facet objects within accumulatedResults. Pass in the
 *                                         value previously returned by this function, or undefined
 *                                         or null for first call. This function doesn't mutate
 *                                         this object.
 */
const addToAccumulatedFacets = (accumulatedResults, currentResults, facetFields, cachedAccumulatedFacets) => {
    const localCache = {};
    facetFields.forEach((facetField) => {
        // Retrieve or update the incoming cache of accumulated results facets.
        let accumulatedFacet;
        if (cachedAccumulatedFacets && cachedAccumulatedFacets[facetField]) {
            // Cache hit: Get the accumulated facet field's results object from the cache the
            // caller saved.
            accumulatedFacet = cachedAccumulatedFacets[facetField];
        } else {
            // Cache miss: Accumulated facet field's results object hasn't been cached, so find it
            // and cache it with a shallow copy of the incoming cache and assigning the new
            // accumulated facet object to the copy.
            accumulatedFacet = accumulatedResults.facets.find(facet => facet.field === facetField);
            localCache[facetField] = accumulatedFacet;
        }

        // Handle the addition of current facet results to the accumulated results.
        const currentFacet = currentResults.facets.find(facet => facet.field === facetField);
        accumulatedFacet.total += currentFacet.total;
        currentFacet.terms.forEach((currentTerm) => {
            const matchingAccumulatedTerm = accumulatedFacet.terms.find(accumulatedTerm => accumulatedTerm.key === currentTerm.key);
            if (matchingAccumulatedTerm) {
                matchingAccumulatedTerm.doc_count += currentTerm.doc_count;
            } else {
                accumulatedFacet.terms.push(currentTerm);
            }
        });
    });

    // Merge the incoming cache with any new cached items into a copy to return.
    return Object.assign({}, cachedAccumulatedFacets || {}, localCache);
};


/**
 * Display a single file facet.
 */
class Facet extends React.Component {
    constructor() {
        super();
        this.handleFacetTermSelect = this.handleFacetTermSelect.bind(this);
    }

    handleFacetTermSelect(term) {
        this.props.facetTermSelectHandler(this.props.facet.field, term);
    }

    render() {
        const { facet, selectedFacetTerms } = this.props;
        return (
            <div className="facet">
                <h5>{facet.title}</h5>
                <ul className="facet-list nav">
                    {facet.terms.map(term => (
                        <div key={term.key}>
                            {term.doc_count > 0 ?
                                <FacetTerm
                                    term={term.key}
                                    termCount={term.doc_count}
                                    totalTermCount={facet.total}
                                    selected={selectedFacetTerms.indexOf(term.key) > -1}
                                    termSelectHandler={this.handleFacetTermSelect}
                                />
                            : null}
                        </div>
                    ))}
                </ul>
            </div>
        );
    }
}

Facet.propTypes = {
    /** Facet object to display */
    facet: PropTypes.object.isRequired,
    /** Selected term keys */
    selectedFacetTerms: PropTypes.array,
    /** Function called when a facet term is clicked */
    facetTermSelectHandler: PropTypes.func.isRequired,
};

Facet.defaultProps = {
    selectedFacetTerms: [],
};


/**
 * Display the file facets.
 */
class FileFacets extends React.Component {
    constructor() {
        super();
        this.state = {
            /** File search result facets to display */
            displayedFacets: null,
            /** Tracks facet loading progress */
            facetLoadProgress: -1,
        };
        this.retrieveFileFacets = this.retrieveFileFacets.bind(this);
    }

    componentDidMount() {
        this.retrieveFileFacets();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.items.length !== this.props.items.length || !_.isEqual(prevProps.items, this.props.items)) {
            this.retrieveFileFacets();
        }
    }

    /**
     * Perform a special search to get just the facet information for files associated with cart
     * items. The cart items are passed in the JSON body of the POST. No search results get
     * returned but we do get file facet information.
     */
    retrieveFileFacets() {
        // Break incoming array of experiment @ids into manageable chunks of arrays, each with
        // CHUNK_SIZE items. Each chunk gets used in a search of files, and all the results get
        // combined into one facet object.
        const CHUNK_SIZE = 500;
        const chunks = [];
        for (let itemIndex = 0; itemIndex < this.props.items.length; itemIndex += CHUNK_SIZE) {
            chunks.push(this.props.items.slice(itemIndex, itemIndex + CHUNK_SIZE));
        }

        // Using the arrays of dataset @id arrays, do a sequence of searches of CHUNK_SIZE datasets
        // adding the totals together to form the final facet.
        let accumulatedFacets;
        chunks.reduce((promiseChain, currentChunk, currentChunkIndex) => (
            promiseChain.then(accumulatedResults => (
                requestFacet(currentChunk, this.context.fetch).then((currentResults) => {
                    this.setState({ facetLoadProgress: Math.round((currentChunkIndex / chunks.length) * 100) });
                    if (accumulatedResults) {
                        accumulatedResults.total += currentResults.total;
                        accumulatedFacets = addToAccumulatedFacets(accumulatedResults, currentResults, displayedFacetFields, accumulatedFacets);
                        return accumulatedResults;
                    }
                    return currentResults;
                })
            ))
        ), Promise.resolve(null)).then((accumulatedResults) => {
            // accumulatedFacets is an object keyed by facet field values for displayed facets --
            // each property "points" to the accumulatedResults facet objects that get displayed.
            const displayedFacets = {};
            displayedFacetFields.forEach((field) => {
                const displayedFacet = accumulatedResults.facets.find(facet => facet.field === field);
                if (displayedFacet) {
                    displayedFacet.terms.sort((a, b) => b.doc_count - a.doc_count);
                }
                displayedFacets[field] = displayedFacet;
            });
            this.setState({ displayedFacets, facetLoadProgress: -1 });
        });
    }

    render() {
        const { selectedTerms, termSelectHandler } = this.props;
        const { displayedFacets } = this.state;
        return (
            <div className="box facets">
                {displayedFacets ?
                    <div>
                        {displayedFacetFields.map(field => (
                            <Facet key={field} facet={displayedFacets[field]} selectedFacetTerms={selectedTerms[field]} facetTermSelectHandler={termSelectHandler} />
                        ))}
                    </div>
                :
                    <progress value={this.state.facetLoadProgress} max="100" />
                }
            </div>
        );
    }
}

FileFacets.propTypes = {
    /** Array of @ids of all items in the cart */
    items: PropTypes.array,
    /** Selected facet field items */
    selectedTerms: PropTypes.object,
    /** Callback when the user clicks on a file format facet item */
    termSelectHandler: PropTypes.func.isRequired,
};

FileFacets.defaultProps = {
    items: [],
    selectedTerms: null,
};

FileFacets.contextTypes = {
    fetch: PropTypes.func,
};


/**
 * Display cart tool buttons.
 */
class CartTools extends React.Component {
    constructor() {
        super();
        this.batchDownload = this.batchDownload.bind(this);
    }

    batchDownload() {
        let contentDisposition;

        // Form query string from currently selected file formats.
        const fileFormatSelections = _.compact(Object.keys(this.props.selectedTerms).map((field) => {
            let subQueryString = '';
            if (this.props.selectedTerms[field].length > 0) {
                subQueryString = this.props.selectedTerms[field].map(term => `files.${field}=${encodedURIComponent(term)}`).join('&');
            }
            return subQueryString;
        }));

        // Initiate a batch download as a POST, passing it all dataset @ids in the payload.
        this.context.fetch(`/batch_download/type=Experiment${fileFormatSelections.length > 0 ? `&${fileFormatSelections.join('&')}` : ''}`, {
            method: 'POST',
            headers: {
                Accept: 'text/plain',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: this.props.items,
            }),
        }).then((response) => {
            if (response.ok) {
                contentDisposition = response.headers.get('content-disposition');
                return response.blob();
            }
            return Promise.reject(new Error(response.statusText));
        }).then((blob) => {
            // Extract filename from batch_download response content disposition tag.
            const matchResults = contentDisposition.match(/filename="(.*?)"/);
            const filename = matchResults ? matchResults[1] : 'files.txt';

            // Make a temporary link in the DOM with the URL from the response blob and then
            // click the link to automatically download the file. Many references to the technique
            // including https://blog.jayway.com/2017/07/13/open-pdf-downloaded-api-javascript/
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch((err) => {
            console.warn('batchDownload error %s:%s', err.name, err.message);
        });
    }

    render() {
        const { items, activeCart, sharedCart } = this.props;

        return (
            <div className="cart__tools">
                {items.length > 0 ? <BatchDownloadModal handleDownloadClick={this.batchDownload} /> : null}
                <CartMergeShared sharedCartObj={sharedCart} />
                {activeCart ? <CartClear /> : null}
            </div>
        );
    }
}

CartTools.propTypes = {
    /** Cart items */
    items: PropTypes.array,
    /** Selected facet terms */
    selectedTerms: PropTypes.object,
    /** True if cart is active, False if cart is shared */
    activeCart: PropTypes.bool,
    /** Items in the shared cart, if that's being displayed */
    sharedCart: PropTypes.object,
};

CartTools.defaultProps = {
    items: [],
    selectedTerms: null,
    activeCart: true,
    sharedCart: null,
};

CartTools.contextTypes = {
    fetch: PropTypes.func,
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
 * Display the pager control area.
 */
const PagerArea = ({ currentPage, totalPageCount, updateCurrentPage }) => (
    <div className="cart__pager">
        {totalPageCount > 1 ?
            <Pager total={totalPageCount} current={currentPage} updateCurrentPage={updateCurrentPage} />
        : null}
    </div>
);

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
            /** Files formats selected to be included in results; all formats if empty array */
            selectedTerms: {},
            /** Currently displayed page of dataset search results */
            currentDatasetResultsPage: 0,
        };
        displayedFacetFields.forEach((field) => {
            this.state.selectedTerms[field] = [];
        });
        this.handleTermSelect = this.handleTermSelect.bind(this);
        this.updateDatasetCurrentPage = this.updateDatasetCurrentPage.bind(this);
    }

    /**
     * Called when the given file format was selected or deselected in the facet.
     * @param {string} format File format facet item that was clicked
     */
    handleTermSelect(clickedField, clickedTerm) {
        this.setState((prevState) => {
            // Determine whether we need to add or subtract a term from the facet selections.
            const addTerm = this.state.selectedTerms[clickedField].indexOf(clickedTerm) === -1;

            // prevState is immutable, so make a copy with the newly clicked term to set the
            // new state.
            const newSelectedTerms = {};
            if (addTerm) {
                // Copy the previous selectedFacetTerms, adding the newly selected term in its
                // facet.
                Object.keys(prevState.selectedTerms).forEach((field) => {
                    const newTerm = clickedField === field ? [clickedTerm] : [];
                    newSelectedTerms[field] = prevState.selectedTerms[field].slice(0).concat(newTerm);
                });
            } else {
                // Copy the previous selectedFacetTerms, filtering out the unselected term in its
                // facet.
                Object.keys(prevState.selectedTerms).forEach((field) => {
                    newSelectedTerms[field] = prevState.selectedTerms[field].filter(term => term !== clickedTerm);
                });
            }
            return { selectedTerms: newSelectedTerms, currentFileResultsPage: 0 };
        });
    }

    /**
     * Called when the user selects a new page of cart items to view.
     * @param {number} newCurrent New current page to view; zero based
     */
    updateDatasetCurrentPage(newCurrent) {
        this.setState({ currentDatasetResultsPage: newCurrent });
    }

    render() {
        const { context, cart } = this.props;

        // Active and shared carts displayed slightly differently. Active carts' contents come from
        // the in-memory Redux store while shared carts' contents come from the cart object `items`
        // property.
        const activeCart = context['@type'][0] === 'cart-view';
        const cartItems = activeCart ? cart : context.items;
        const totalDatasetPages = Math.floor(cartItems.length / PAGE_ITEM_COUNT) + (cartItems.length % PAGE_ITEM_COUNT !== 0 ? 1 : 0);

        return (
            <div className={itemClass(context, 'view-item')}>
                <header className="row">
                    <div className="col-sm-12">
                        <h2>Cart</h2>
                    </div>
                </header>
                <Panel addClasses="cart__result-table">
                    <PanelHeading addClasses="cart__header">
                        <PagerArea currentPage={this.state.currentDatasetResultsPage} totalPageCount={totalDatasetPages} updateCurrentPage={this.updateDatasetCurrentPage} />
                        <CartTools items={cartItems} selectedTerms={this.state.selectedTerms} activeCart={activeCart} sharedCart={context} />
                    </PanelHeading>
                    <ItemCountArea itemCount={cartItems.length} itemName="dataset" itemNamePlural="datasets" />
                    <PanelBody>
                        {cartItems.length > 0 ?
                            <div className="cart__display">
                                <FileFacets items={cartItems} selectedTerms={this.state.selectedTerms} termSelectHandler={this.handleTermSelect} />
                                <CartSearchResults items={cartItems} currentPage={this.state.currentDatasetResultsPage} activeCart={activeCart} />
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
    /** Cart object to display */
    context: PropTypes.object.isRequired,
    /** In-memory cart contents */
    cart: PropTypes.array.isRequired,
    /** System fetch function */
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    context: ownProps.context,
});

const CartInternal = connect(mapStateToProps)(CartComponent);


const Cart = (props, reactContext) => (
    <CartInternal context={props.context} fetch={reactContext.fetch} />
);

Cart.propTypes = {
    context: PropTypes.object.isRequired,
};

contentViews.register(Cart, 'cart-view'); // /cart-view/ URI
contentViews.register(Cart, 'Cart'); // /carts/<uuid> URI

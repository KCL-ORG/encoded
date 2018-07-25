import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addMultipleToCartAndSave } from './actions';
import { encodedURIComponent } from '../globals';
import { requestSearch } from '../objectutils';


class CartAddAllComponent extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        const searchQuery = `${this.props.searchFilterElements.map(element => (
            `${element.field}=${encodedURIComponent(element.term)}`
        )).join('&')}&limit=all&field=%40id`;
        requestSearch(searchQuery).then((results) => {
            if (Object.keys(results).length > 0 && results['@graph'].length > 0) {
                const itemsForCart = results['@graph'].map(result => result['@id']);
                this.props.addAllResults(itemsForCart);
            }
        });
    }

    render() {
        return <button className="btn btn-info btn-sm" onClick={this.handleClick}>Add all</button>;
    }
}

CartAddAllComponent.propTypes = {
    searchFilterElements: PropTypes.array.isRequired, // Array of elements making a search of items to add to the cart
    addAllResults: PropTypes.func.isRequired, // Function to call when Add All clicked
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, searchFilterElements: ownProps.searchFilterElements });
const mapDispatchToProps = (dispatch, ownProps) => ({
    addAllResults: itemsForCart => dispatch(addMultipleToCartAndSave(itemsForCart, ownProps.sessionProperties.user, ownProps.fetch)),
});

const CartAddAllInternal = connect(mapStateToProps, mapDispatchToProps)(CartAddAllComponent);

const CartAddAll = (props, reactContext) => (
    <CartAddAllInternal searchFilterElements={props.searchFilterElements} sessionProperties={reactContext.session_properties} fetch={reactContext.fetch} />
);

CartAddAll.propTypes = {
    searchFilterElements: PropTypes.array.isRequired, // @id of current object being added
};

CartAddAll.contextTypes = {
    session_properties: PropTypes.object,
    fetch: PropTypes.func,
};

export default CartAddAll;

// Components and functions to modify the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { svgIcon } from '../../libs/svg-icons';
import { addToCartAndSave, removeFromCartAndSave } from './actions';


// Button to add the current object to the cart, or to remove it.
class CartToggleComponent extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        const { cart, current, onRemoveFromCartClick, onAddToCartClick } = this.props;
        const onClick = (cart.indexOf(current) > -1) ? onRemoveFromCartClick : onAddToCartClick;
        onClick();
    }

    render() {
        const { cart, inProgress, savedCartObj, current } = this.props;
        const inCart = cart.indexOf(current) > -1;
        const saved = (savedCartObj.elements && savedCartObj.elements.length > 0) ? savedCartObj.elements.indexOf(current) > -1 : false;

        return (
            <div className="cart__toggle">
                <div className={`cart__checkbox${inCart ? ' cart__checkbox--in-cart' : ''}`}>
                    <button
                        onClick={this.handleClick}
                        disabled={inProgress}
                        title={inCart ? 'Remove from cart' : 'Add to cart'}
                        aria-pressed={inCart}
                        aria-label={inCart ? `Remove ${saved ? 'saved' : 'unsaved'} item from cart` : `Add ${saved ? 'saved' : 'unsaved'} item to cart`}
                    >
                        {svgIcon('cart')}
                    </button>
                </div>
            </div>
        );
    }
}

CartToggleComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    inProgress: PropTypes.bool, // True if cart operation is in progress
    savedCartObj: PropTypes.object, // Current user's saved cart
    current: PropTypes.string.isRequired, // @id of current object being added
    onAddToCartClick: PropTypes.func.isRequired, // Function to call when Add to Cart clicked
    onRemoveFromCartClick: PropTypes.func.isRequired, // Function to call when Remove from Cart clicked
};

CartToggleComponent.defaultProps = {
    cart: [],
    inProgress: false,
    savedCartObj: {},
};


const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    inProgress: state.inProgress,
    savedCartObj: state.savedCartObj || null,
    current: ownProps.current['@id'],
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onAddToCartClick: () => dispatch(addToCartAndSave(ownProps.current['@id'], ownProps.sessionProperties.user, ownProps.fetch)),
    onRemoveFromCartClick: () => dispatch(removeFromCartAndSave(ownProps.current['@id'], ownProps.sessionProperties.user, ownProps.fetch)),
});

const CartToggleInternal = connect(mapStateToProps, mapDispatchToProps)(CartToggleComponent);

const CartToggle = (props, reactContext) => (
    <CartToggleInternal current={props.current} sessionProperties={reactContext.session_properties} fetch={reactContext.fetch} />
);

CartToggle.propTypes = {
    current: PropTypes.object.isRequired, // @id of current object being added
};

CartToggle.contextTypes = {
    session_properties: PropTypes.object,
    fetch: PropTypes.func,
};

export default CartToggle;
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { removeMultipleFromCart } from './actions';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../libs/bootstrap/modal';


// Renders a button that allows the user to clear the entire cart contents.
class CartClearComponent extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.onClearCartClick(this.props.cart);
    }

    render() {
        if (this.props.cart.length > 0) {
            return (
                <Modal actuator={<button className="btn btn-info btn-sm">Clear cart</button>}>
                    <ModalHeader title="Clear entire cart contents" closeModal />
                    <ModalBody>
                        <p>Clearing the cart is not undoable.</p>
                    </ModalBody>
                    <ModalFooter
                        closeModal={<button className="btn btn-info">Close</button>}
                        submitBtn={this.handleClick}
                        submitTitle="Clear cart"
                    />
                </Modal>
            );
        }
        return null;
    }
}

CartClearComponent.propTypes = {
    cart: PropTypes.array, // Current contents of cart
    onClearCartClick: PropTypes.func.isRequired, // Function called to remove all items
};

CartClearComponent.defaultProps = {
    cart: [],
};

const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    user: ownProps.sessionProperties,
});
const mapDispatchToProps = dispatch => ({
    onClearCartClick: itemAtIds => dispatch(removeMultipleFromCart(itemAtIds)),
});

const CartClearInternal = connect(mapStateToProps, mapDispatchToProps)(CartClearComponent);

const CartClear = (props, reactContext) => (
    <CartClearInternal sessionProperties={reactContext.session_properties} />
);

CartClear.contextTypes = {
    session_properties: PropTypes.object,
};

export default CartClear;

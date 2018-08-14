import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { removeMultipleFromCartAndSave } from './actions';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../libs/bootstrap/modal';


// Renders a button that allows the user to clear the entire cart contents.
class CartClearComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            /** True if modal about clearing the cart is visible */
            modalOpen: false,
            /** True if in-progress spinner visible */
            spinnerVisible: false,
        };
        this.handleClearCartClick = this.handleClearCartClick.bind(this);
        this.handleConfirmClearClick = this.handleConfirmClearClick.bind(this);
    }

    /**
     * Handle a click in the Clear Cart button by showing the confirmation modal.
     */
    handleClearCartClick() {
        this.setState({ modalOpen: true });
    }

    /**
     * Handle a click on the button in the modal confirming clearing the cart.
     */
    handleConfirmClearClick() {
        this.setState({ spinnerVisible: true });
        this.props.onClearCartClick(this.props.cart).then(() => {
            this.setState({ modalOpen: false, spinnerVisible: false });
        });
    }

    render() {
        if (this.props.cart.length > 0) {
            return (
                <span>
                    <button onClick={this.handleClearCartClick} className="btn btn-info btn-sm">Clear cart</button>
                    {this.state.modalOpen ?
                        <Modal>
                            <ModalHeader title="Clear entire cart contents" closeModal />
                            <ModalBody>
                                {this.state.spinnerVisible ? <div className="loading-spinner" /> : null}
                                <p>Clearing the cart is not undoable.</p>
                            </ModalBody>
                            <ModalFooter
                                closeModal={<button className="btn btn-info">Close</button>}
                                submitBtn={this.handleConfirmClearClick}
                                submitTitle="Clear cart"
                            />
                        </Modal>
                    : null}
                </span>
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
const mapDispatchToProps = (dispatch, ownProps) => ({
    onClearCartClick: itemAtIds => dispatch(removeMultipleFromCartAndSave(itemAtIds, ownProps.sessionProperties.user, ownProps.fetch)),
});

const CartClearInternal = connect(mapStateToProps, mapDispatchToProps)(CartClearComponent);

const CartClear = (props, reactContext) => (
    <CartClearInternal sessionProperties={reactContext.session_properties} fetch={reactContext.fetch} />
);

CartClear.contextTypes = {
    session_properties: PropTypes.object,
    fetch: PropTypes.func,
};

export default CartClear;

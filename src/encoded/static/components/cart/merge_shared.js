import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../libs/bootstrap/modal';
import { addMultipleToCart } from './actions';


class CartMergeSharedComponent extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.props.onMergeCartClick(this.props.sharedCartItems);
    }

    render() {
        const { sharedCartItems } = this.props;

        if (sharedCartItems.length > 0) {
            return (
                <Modal actuator={<button className="btn btn-info btn-sm">Add to my cart</button>}>
                    <ModalHeader title="Clear entire cart contents" closeModal />
                    <ModalBody>
                        <p>Add the contents of this shared cart to your cart. Any items already in your cart won&.</p>
                    </ModalBody>
                    <ModalFooter
                        closeModal={<button className="btn btn-info">Close</button>}
                        submitBtn={<button className="btn btn-info" onClick={this.handleClick}>Add to my cart</button>}
                    />
                </Modal>
            );
        }
        return null;
    }
}

CartMergeSharedComponent.propTypes = {
    sharedCartItems: PropTypes.array, // Item @ids in shared cart
    onMergeCartClick: PropTypes.func.isRequired, // Called to merge shared cart with own cart
};

CartMergeSharedComponent.defaultProps = {
    sharedCartItems: [],
};

const mapStateToProps = (state, ownProps) => ({ cart: state.cart, sharedCartItems: ownProps.sharedCartItems });
const mapDispatchToProps = dispatch => ({
    onMergeCartClick: itemAtIds => dispatch(addMultipleToCart(itemAtIds)),
});

const CartMergeShared = connect(mapStateToProps, mapDispatchToProps)(CartMergeSharedComponent);

export default CartMergeShared;

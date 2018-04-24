// Components to display the status of the cart.
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import url from 'url';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../libs/bootstrap/modal';


// Button to add the current object to the cart, or to remove it.
const CartShareComponent = ({ cart, userCart }, reactContext) => {
    const parsedUrl = url.parse(reactContext.location_href);
    parsedUrl.pathname = userCart['@id'];
    parsedUrl.search = '';
    parsedUrl.query = '';
    const sharableUrl = url.format(parsedUrl);
    return (
        cart.length > 0 ?
            <Modal actuator={<button className="btn btn-info btn-sm">Share</button>}>
                <ModalHeader title="Share cart" closeModal />
                <ModalBody>
                    <p>
                        Click the &ldquo;Download&rdquo; button below to download a &ldquo;files.txt&rdquo; file that contains a list of URLs to a file containing all the experimental metadata and links to download the file.
                        The first line of the file will always be the URL to download the metadata file. <br />
                        Further description of the contents of the metadata file are described in the <a href="/help/batch-download/">Batch Download help doc</a>.
                    </p>
                    <code>{sharableUrl}</code>
                </ModalBody>
                <ModalFooter
                    closeModal={<button className="btn btn-info btn-sm">Close</button>}
                    dontClose
                />
            </Modal>
        : null
    );
};

CartShareComponent.propTypes = {
    cart: PropTypes.array, // Cart contents
    userCart: PropTypes.object,
};

CartShareComponent.defaultProps = {
    cart: [],
    userCart: {},
};

CartShareComponent.contextTypes = {
    session: PropTypes.object, // Login information
    location_href: PropTypes.string, // URL of this experiment page, including query string stuff
};


const mapStateToProps = (state, ownProps) => ({
    cart: state.cart,
    userCart: ownProps.userCart,
});

const CartShare = connect(mapStateToProps)(CartShareComponent);
export default CartShare;

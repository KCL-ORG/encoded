import React from 'react';
import PropTypes from 'prop-types';
import * as globals from './globals';


/**
 * Update the grouping object in the DB. You must provide `groupingAtId` because `grouping` cannot
 * have non-writeable properties in it, and @id is one of several non-writeable properites. You
 * normally get an object with no non-writeable properties by doing a GET request on that object
 * with "frame=edit" in the query string.
 *
 * @param {object} grouping - grouping object to update; must be editable version (no @id etc)
 * @param {string} groupingAtId - @id of the grouping object to update
 * @param {func} fetch - fetch function to use
 * @return (object) - Promise containing PUT response that resolves when GET request completes
 */
function updateGrouping(grouping, groupingAtId, fetch) {
    return fetch(groupingAtId, {
        method: 'PUT',
        body: JSON.stringify(grouping),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        if (!response.ok) {
            throw response;
        }
        return response.json();
    }).catch(globals.parseAndLogError.bind('Update grouping', 'putRequest'));
}


/**
 * Get a writeable version of the grouping object specified by `groupingAtId`.
 *
 * @param {string} groupingAtId - @id of the grouping object to retrieve
 * @param {func} fetch - fetch function to use
 * @return {object} - Promise containing the retrieved grouping object, or an error response
 */
function getWriteableGrouping(groupingAtId, fetch) {
    return fetch(`${groupingAtId}?frame=edit`, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    }).then((response) => {
        if (!response.ok) {
            throw response;
        }
        return response.json();
    }).catch(globals.parseAndLogError.bind('Get writeable grouping', 'putRequest'));
}


// Render the Add to Group button and react to clicks in it by updating the current grouping object
// to include the UUID of the object given in `objToAdd`.
class GroupingAdd extends React.Component {
    constructor() {
        super();

        // Bind `this` to non-React methods.
        this.addAction = this.addAction.bind(this);
    }

    addAction() {
        const { grouping, objToAdd } = this.props;

        // Adding the given object UUID to the current user's grouping's `grouped_items` array.
        // Start by getting the user's grouping object with "frame=edit" to get a PUTable version
        // of the object.
        getWriteableGrouping(grouping['@id'], this.context.fetch).then((writeableGrouping) => {
            // Add the new UUID to the end of the `grouped_items` array and then write it to the
            // db.
            writeableGrouping.grouped_items.push(objToAdd.uuid);
            return updateGrouping(writeableGrouping, grouping['@id'], this.context.fetch);
        });
    }

    render() {
        const { grouping, objToAdd } = this.props;

        // Determine if the object in `objToAdd` is already in the current grouping or not.
        const inGrouping = !!grouping.grouped_items.find(groupedItem => groupedItem === objToAdd.uuid);

        return (
            <button onClick={this.addAction} disabled={inGrouping}>{inGrouping ? 'In grouping' : 'Add to grouping'}</button>
        );
    }
}

GroupingAdd.propTypes = {
    grouping: PropTypes.object.isRequired, // grouping object for the current user
    objToAdd: PropTypes.object.isRequired, // Object to add to grouping; must have uuid property
};

GroupingAdd.contextTypes = {
    fetch: PropTypes.func,
};

export default GroupingAdd;

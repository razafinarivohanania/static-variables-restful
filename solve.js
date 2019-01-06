'use strict';

const GLOBAL_VARIABLES = {};

function sendError(res, error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500)
        .send({ error: error });
}

function sendResponse(res, response) {
    res.setHeader('Content-Type', 'application/json');
    res.send(response);
}

function getSession(req, res) {
    const session = req.query.session;
    if (!session) {
        sendError(res, 'Session is blank');
        return;
    }

    return session;
}

function getAction(req, res) {
    let action = req.query.action;
    if (!action) {
        sendError(res, 'Action is blank');
        return;
    }

    action = action.trim().toLowerCase();
    const actions = ['set', 'get'];
    if (actions.includes(action))
        return action;

    sendError(res, `Unrecognized action [${action}]`);
}

function getVariable(req, res) {
    const variable = req.query.variable;
    if (!variable) {
        sendError(res, 'Variable is blank');
        return;
    }

    return variable;
}

function getType(req, res) {
    let type = req.query.type;
    if (!type) {
        sendError(res, 'Variable type is blank');
        return;
    }

    type = type.trim().toLowerCase();
    const types = ['string', 'set', 'map'];
    if (types.includes(type))
        return type;

    sendError(res, `Unrecognized variable type [${type}]`);
}

function getValue(req, res) {
    const value = req.query.value;
    if (typeof value == 'undefined')
        sendError(res, 'Variable value is undefined');

    return value;
}

function getKey(req, res) {
    const key = req.query.key;
    if (!key)
        sendError(res, 'Key for map is blank');

    return key;
}

function retrieveParameters(req, res) {
    const session = getSession(req, res);
    if (!session) return;

    const variable = getVariable(req, res);
    if (!variable) return;

    const action = getAction(req, res);
    if (!action) return;

    let type;
    let value;
    if (action == 'set') {
        type = getType(req, res);
        if (!type) return;

        value = getValue(req, res);
        if (typeof value == 'undefined')
            return;
    }

    let key;
    if (type == 'map') {
        key = getKey(req, res);
        if (!key) return;
    }

    return {
        session: session,
        variable: variable,
        action: action,
        type: type,
        value: value,
        key: key
    };
}

function setVariable(parameters) {
    if (!GLOBAL_VARIABLES[parameters.session])
        GLOBAL_VARIABLES[parameters.session] = {};

    if (!GLOBAL_VARIABLES[parameters.session][parameters.variable])
        GLOBAL_VARIABLES[parameters.session][parameters.variable] = {};

    if (parameters.type == 'string') {
        GLOBAL_VARIABLES[parameters.session][parameters.variable] = parameters.value;
        return;
    }

    if (parameters.type == 'set') {
        const value = GLOBAL_VARIABLES[parameters.session][parameters.variable];

        if (value instanceof Set) {
            GLOBAL_VARIABLES[parameters.session][parameters.variable].add(parameters.value);
            return;
        }

        GLOBAL_VARIABLES[parameters.session][parameters.variable] = new Set();
        GLOBAL_VARIABLES[parameters.session][parameters.variable].add(parameters.value);
        return;
    }

    if (parameters.type == 'map') {
        const value = GLOBAL_VARIABLES[parameters.session][parameters.variable];

        if (value instanceof Map) {
            value.set(parameters.key, parameters.value);
            return;
        }

        GLOBAL_VARIABLES[parameters.session][parameters.variable] = new Map();
        GLOBAL_VARIABLES[parameters.session][parameters.variable].set(parameters.key, parameters.value);
    }
}

function getVariableValue(parameters) {
    const session = GLOBAL_VARIABLES[parameters.session];
    if (!session)
        return;

    const variable = session[parameters.variable];
    if (typeof variable == 'undefined')
        return;

    if (variable instanceof Set)
        return Array.from(variable);

    if (variable instanceof Map) {
        const array = [];

        variable.forEach((value, key) => array.push({
            key: key,
            value: value
        }));

        return array;
    }

    return '' + variable;
}

function solve(req, res) {
    const parameters = retrieveParameters(req, res);
    if (!parameters) return;

    if (parameters.action == 'set') {
        setVariable(parameters);
        sendResponse(res, { success: true });
        return;
    }

    if (parameters.action == 'get') {
        const value = getVariableValue(parameters);

        if (typeof value == 'undefined')
            sendError(res, 'Undefined variable');
        else
            sendResponse(res, { value: value });
    } 
}

module.exports = solve;
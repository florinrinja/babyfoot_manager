const formatQuery = (options) => {

    const statements = [];

    // Check for options
    if (options) {
        // Get include and exclude query options by object destructuring
        const { include, exclude } = options;

        // Push formated include and exclude query options
        if (include) statements.push(getIncludeStatements(include));
        if (exclude) statements.push(getExcludeStatements(exclude));
    }

    // return array of SQL readable where statements or by default, if no options, send an empty array
    return statements;
};

const getIncludeStatements = (include) => {
    const keys = Object.keys(include);
    const values = Object.values(include);

    // Return array of SQl readable statements from include object keys and values
    return [...keys.map((key, index) => (
        // Format query for multiple values
        `${key} ${isMultipleQueryValues(values[index]) ? 'IN (' : '='} '${values[index]}'${isMultipleQueryValues(values[index]) ? ')' : ''}`
    ))];
}

const getExcludeStatements = (exclude) => {
    const keys = Object.keys(exclude);
    const values = Object.values(exclude);

    // Return array of SQl readable statements from exclude object keys and values
    return [...keys.map((key, index) => (
        // Format query for multiple values
        `${key} ${isMultipleQueryValues(values[index]) ? 'NOT IN (' : '!='} '${values[index]}'${isMultipleQueryValues(values[index]) ? ')' : ''}`
    ))];
}

const isMultipleQueryValues = (value) => value.split(',').length > 1;

module.exports = formatQuery;
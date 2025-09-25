const removeNull = require("./remove-null").removeNull;

const constructParams = ({ tableName, attributes }, props = {}) => {
  const { id, ...rest } = attributes;
  const filteredStep = removeNull(rest);

  const keyVal = Object.entries(props)?.[0];

  const primaryKey = keyVal?.[0] || "id";

  if (primaryKey && filteredStep?.[primaryKey]) {
    delete filteredStep?.[primaryKey];
  }

  const initParam = {
    TableName: tableName,
    Key: {
      [primaryKey]: keyVal?.[1] || id,
    },
    ExpressionAttributeNames: {},
    UpdateExpression: "",
    ExpressionAttributeValues: {},
    ConditionExpression: `attribute_exists(${primaryKey})`,
  };

  const updatedStepParams = Object.entries(filteredStep).reduce(
    (acc, [key, val]) => {
      return {
        ...acc,
        ExpressionAttributeNames: {
          ...acc.ExpressionAttributeNames,
          [`#${key}`]: key,
        },
        UpdateExpression: acc.UpdateExpression.includes("set")
          ? `${acc.UpdateExpression}, #${key} = :${key}`
          : `set #${key} = :${key}`,
        ExpressionAttributeValues: {
          ...acc.ExpressionAttributeValues,
          [`:${key}`]: val,
        },
      };
    },
    initParam
  );

  return updatedStepParams;
};

module.exports = { constructParams };

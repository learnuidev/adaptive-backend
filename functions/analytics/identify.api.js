const AWS = require("aws-sdk");

const { removeNull } = require("../../utils/remove-null");
const { tableNames } = require("../../constants/table-names");
const { apiConfig } = require("../../constants/api-config");

const dynamodb = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
  region: apiConfig.region,
});

const identifyApi = async (props) => {
  // Using emailAndDeviceType as the primary key to upsert
  const { emailAndDeviceType, ...rest } = props;

  // current timestamp
  const now = Date.now();

  // Remove null or undefined from props except createdAt and updatedAt
  const cleanProps = removeNull(rest);

  // Build UpdateExpression and ExpressionAttributeValues dynamically
  let updateExpression = "SET updatedAt = :updatedAt";
  const expressionAttributeValues = {
    ":updatedAt": now,
  };
  const expressionAttributeNames = {};

  // Include all properties from cleanProps in update expression
  Object.keys(cleanProps).forEach((key, idx) => {
    const attrNameKey = `#attr${idx}`;
    const attrValueKey = `:val${idx}`;
    updateExpression += `, ${attrNameKey} = ${attrValueKey}`;
    expressionAttributeNames[attrNameKey] = key;
    expressionAttributeValues[attrValueKey] = cleanProps[key];
  });

  // Conditionally set createdAt only if attribute_not_exists
  updateExpression += " ADD createdAt :createdAt";
  // Instead of ADD which is for numeric, we use SET with if_not_exists function:
  // Correct approach (replace ADD line):
  updateExpression = updateExpression.replace(
    "ADD createdAt :createdAt",
    "SET createdAt = if_not_exists(createdAt, :createdAt)"
  );
  expressionAttributeValues[":createdAt"] = now;

  const params = {
    TableName: tableNames.identifyTable,
    Key: { emailAndDeviceType },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  const result = await dynamodb.update(params).promise();
  return result.Attributes;
};

module.exports = {
  identifyApi,
};

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { ulid } from "ulid";
import { addDays } from "date-fns";
import { randomBytes, createHmac } from "crypto";

import { sendInvitationEmail } from "./invitation-utils.js";
import { CreateInvitationRequest, TeamInvitation } from "adaptive.fyi";
import { InvitationStatus } from "./team-invitationts.types.js";
import { tableNames } from "../../constants/table-names.js";
import { apiConfig } from "../../constants/api-config.js";

const client = new DynamoDBClient({
  region: apiConfig.region,
});
const docClient = DynamoDBDocumentClient.from(client);

// const TABLE_NAME = tableNames.teamInvitationTable;

/**
 * Generate a secure invitation token
 */
const generateSecureToken = (invitationId: string, email: string, websiteId: string): string => {
  const timestamp = Date.now().toString();
  const randomString = randomBytes(32).toString('hex');
  
  // Create HMAC signature using invitation data
  const payload = `${invitationId}:${email}:${websiteId}:${timestamp}`;
  const signature = createHmac('sha256', process.env.INVITATION_SECRET || 'default-secret')
    .update(payload)
    .digest('hex');
  
  // Combine all parts into a secure token
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  
  return token;
};

/**
 * Verify an invitation token
 */
export const verifyInvitationToken = (token: string): { valid: boolean; data?: any; error?: string } => {
  try {
    // Decode the base64url token
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    
    if (parts.length !== 5) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [invitationId, email, websiteId, timestamp, signature] = parts;
    
    // Check if token has expired (7 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    if (tokenAge > maxAge) {
      return { valid: false, error: 'Token has expired' };
    }
    
    // Verify the signature
    const payload = `${invitationId}:${email}:${websiteId}:${timestamp}`;
    const expectedSignature = createHmac('sha256', process.env.INVITATION_SECRET || 'default-secret')
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    return {
      valid: true,
      data: {
        invitationId,
        email,
        websiteId,
        timestamp: parseInt(timestamp)
      }
    };
  } catch (error) {
    return { valid: false, error: 'Failed to decode token' };
  }
};

export const createTeamInvitationApi = async (
  request: CreateInvitationRequest,
  inviterUserId?: string
): Promise<TeamInvitation> => {
  const invitationId = ulid();
  
  const invitation: TeamInvitation = {
    id: invitationId,
    email: request.email.toLowerCase(),
    websiteId: request.websiteId,
    role: request.role,
    status: InvitationStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: addDays(new Date(), 7).toISOString(), // Expire in 7 days
    message: request.message,
    invitedBy: inviterUserId || "system", // Extract from auth context or default to system
  };

  // Generate secure token for this invitation
  const secureToken = generateSecureToken(invitationId, request.email, request.websiteId);
  
  // Add the token to the invitation (we'll need to extend the schema)
  (invitation as any).token = secureToken;

  // Check if there's already a pending invitation for this email and website
  // Note: This check would require a GSI (Global Secondary Index) on email+websiteId
  // For now, we'll skip this check to avoid DynamoDB query complexity
  // In production, you should implement this check with a proper GSI

  const params = {
    TableName: tableNames.teamInvitationTable,
    Item: invitation,
    ConditionExpression: "attribute_not_exists(id)", // Prevent overwriting existing invitations
  };

  try {
    await docClient.send(new PutCommand(params));

    // Send invitation email
    try {
      await sendInvitationEmail(invitation);
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the invitation creation, but log the error
      // In production, you might want to retry this or handle it differently
    }

    return invitation;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error("Invitation with this ID already exists");
    }
    throw error;
  }
};

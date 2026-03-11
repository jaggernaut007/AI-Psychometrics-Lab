/**
 * GET /api/v1/inventories - List available psychometric inventories
 * This endpoint is public (no auth required).
 *
 * @author Shreyas Jagannath
 */

import { apiSuccess } from '@/lib/api-response';
import { INVENTORY_METADATA } from '@apl/psychometrics-core';

export async function GET() {
  return apiSuccess(INVENTORY_METADATA);
}

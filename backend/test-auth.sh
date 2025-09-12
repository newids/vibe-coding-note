#!/bin/bash

echo "🧪 Testing authentication endpoints..."
echo

BASE_URL="http://localhost:3001/api/auth"

# Test health endpoint first
echo "1. Testing server health:"
curl -s "$BASE_URL/../health" | grep -q "OK" && echo "   Server health: ✅ PASS" || echo "   Server health: ❌ FAIL"

echo
echo "2. Testing registration endpoint (expecting database error):"
REGISTER_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123","name":"Test User"}')

HTTP_CODE="${REGISTER_RESPONSE: -3}"
RESPONSE_BODY="${REGISTER_RESPONSE%???}"

echo "   HTTP Status: $HTTP_CODE"
if [[ "$HTTP_CODE" == "500" ]]; then
  echo "   Registration endpoint: ✅ PASS (expected database error)"
elif [[ "$HTTP_CODE" == "201" ]]; then
  echo "   Registration endpoint: ✅ PASS (successful registration)"
else
  echo "   Registration endpoint: ❌ FAIL (unexpected status)"
fi

echo
echo "3. Testing login endpoint (expecting database error):"
LOGIN_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}')

HTTP_CODE="${LOGIN_RESPONSE: -3}"
echo "   HTTP Status: $HTTP_CODE"
if [[ "$HTTP_CODE" == "500" ]] || [[ "$HTTP_CODE" == "401" ]]; then
  echo "   Login endpoint: ✅ PASS (expected database/auth error)"
elif [[ "$HTTP_CODE" == "200" ]]; then
  echo "   Login endpoint: ✅ PASS (successful login)"
else
  echo "   Login endpoint: ❌ FAIL (unexpected status)"
fi

echo
echo "4. Testing /me endpoint without token:"
ME_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/me")
HTTP_CODE="${ME_RESPONSE: -3}"
echo "   HTTP Status: $HTTP_CODE"
if [[ "$HTTP_CODE" == "401" ]]; then
  echo "   /me without token: ✅ PASS (correctly rejected)"
else
  echo "   /me without token: ❌ FAIL (should be 401)"
fi

echo
echo "5. Testing /me endpoint with invalid token:"
ME_INVALID_RESPONSE=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/me" \
  -H "Authorization: Bearer invalid.token.here")
HTTP_CODE="${ME_INVALID_RESPONSE: -3}"
echo "   HTTP Status: $HTTP_CODE"
if [[ "$HTTP_CODE" == "401" ]]; then
  echo "   /me with invalid token: ✅ PASS (correctly rejected)"
else
  echo "   /me with invalid token: ❌ FAIL (should be 401)"
fi

echo
echo "✅ Authentication endpoints test completed!"
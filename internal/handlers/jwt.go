package handlers

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/shadowcrawler/clp/internal/state"
)

// TokenClaims are the JWT claims embedded in both access and refresh tokens.
type TokenClaims struct {
	TenantID     string `json:"tenant_id"`
	DeploymentID string `json:"deployment_id"`
	TokenType    string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

func mintToken(tenantID, deploymentID, tokenType, expiryStr string) (string, error) {
	d, err := time.ParseDuration(expiryStr)
	if err != nil {
		return "", fmt.Errorf("invalid token expiry %q: %w", expiryStr, err)
	}
	claims := TokenClaims{
		TenantID:     tenantID,
		DeploymentID: deploymentID,
		TokenType:    tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   deploymentID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(d)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(state.AppState.JWTSecret()))
}

func mintTokenPair(tenantID, deploymentID string) (accessToken, refreshToken string, err error) {
	accessToken, err = mintToken(tenantID, deploymentID, "access", state.AppState.JWTExpiry())
	if err != nil {
		return
	}
	refreshToken, err = mintToken(tenantID, deploymentID, "refresh", state.AppState.JWTRefreshExpiry())
	return
}

func parseRefreshToken(tokenStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(state.AppState.JWTSecret()), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	if claims.TokenType != "refresh" {
		return nil, fmt.Errorf("not a refresh token")
	}
	return claims, nil
}

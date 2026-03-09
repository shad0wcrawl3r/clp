package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/state"
)

// CreateFeatureRequest is the request body for creating a feature.
type CreateFeatureRequest struct {
	FeatureCode string `json:"feature_code" example:"ADVANCED_ANALYTICS"`
	Name        string `json:"name"         example:"Advanced Analytics"`
	Description string `json:"description"  example:"Enables advanced analytics dashboards"`
	Category    string `json:"category"     example:"analytics"`
}

// ListFeatures godoc
// @Summary     List all features
// @Description Returns the full feature catalog ordered by feature code.
// @Tags        features
// @Produce     json
// @Success     200 {array}  database.Feature
// @Failure     500 {object} ErrorResponse
// @Router      /features [get]
func ListFeatures(c fiber.Ctx) error {
	features, err := state.AppState.DB().ListFeatures(context.Background())
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(features)
}

// CreateFeature godoc
// @Summary     Create a feature
// @Description Adds a new feature to the catalog.
// @Tags        features
// @Accept      json
// @Produce     json
// @Param       body body     CreateFeatureRequest true "Feature"
// @Success     201  {object} database.Feature
// @Failure     400  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /features [post]
func CreateFeature(c fiber.Ctx) error {
	var req CreateFeatureRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	feature, err := state.AppState.DB().CreateFeature(context.Background(), database.CreateFeatureParams{
		FeatureCode: req.FeatureCode,
		Name:        req.Name,
		Description: optText(req.Description),
		Category:    optText(req.Category),
	})
	if err != nil {
		return dbErr(c, err)
	}
	return c.Status(fiber.StatusCreated).JSON(feature)
}

// GetFeatureByCode godoc
// @Summary     Get feature by code
// @Description Returns a feature by its unique feature code.
// @Tags        features
// @Produce     json
// @Param       code path     string true "Feature code"
// @Success     200  {object} database.Feature
// @Failure     404  {object} ErrorResponse
// @Failure     500  {object} ErrorResponse
// @Router      /features/{code} [get]
func GetFeatureByCode(c fiber.Ctx) error {
	feature, err := state.AppState.DB().GetFeatureByCode(context.Background(), c.Params("code"))
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(feature)
}

// DeleteFeature godoc
// @Summary     Delete a feature
// @Description Permanently removes a feature from the catalog by UUID.
// @Tags        features
// @Param       id  path string true "Feature UUID"
// @Success     204 "No Content"
// @Failure     400 {object} ErrorResponse
// @Failure     500 {object} ErrorResponse
// @Router      /features/{id} [delete]
func DeleteFeature(c fiber.Ctx) error {
	id, err := parseUUID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{Error: err.Error()})
	}
	if err := state.AppState.DB().DeleteFeature(context.Background(), id); err != nil {
		return dbErr(c, err)
	}
	return c.SendStatus(fiber.StatusNoContent)
}

package handlers

import (
	"context"

	"github.com/gofiber/fiber/v3"
	"github.com/shadowcrawler/clp/internal/state"
)

// ExpireSubscriptionsResponse is the response for expiring subscriptions.
type ExpireSubscriptionsResponse struct {
	Expired int64 `json:"expired" example:"3"`
}

// ExpireSubscriptions godoc
// @Summary     Expire overdue subscriptions
// @Description Sets status to "expired" for all subscriptions whose end_date is in the past and are not already expired or cancelled.
// @Tags        admin
// @Produce     json
// @Success     200 {object} ExpireSubscriptionsResponse
// @Failure     500 {object} ErrorResponse
// @Router      /admin/subscriptions/expire [post]
func ExpireSubscriptions(c fiber.Ctx) error {
	count, err := state.AppState.DB().ExpireSubscriptions(context.Background())
	if err != nil {
		return dbErr(c, err)
	}
	return c.JSON(ExpireSubscriptionsResponse{Expired: count})
}

// Package api — REST API server for Open Chain custom module queries.
//
// Provides a standalone HTTP server that can run alongside the Cosmos SDK
// application, exposing custom module query endpoints. In production, these
// handlers are registered on the existing gRPC-gateway REST server (port 1317).
// For development and testing, the standalone server can be started separately.
//
// Usage:
//
//	server := api.NewRESTServer(":1318", keepers, ctxProvider)
//	go server.Start()
//	defer server.Stop()

package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"

	achievementkeeper "openchain/x/achievement/keeper"
	govuidkeeper "openchain/x/govuid/keeper"
	otkkeeper "openchain/x/otk/keeper"
	uidkeeper "openchain/x/uid/keeper"
)

// RESTServer wraps an HTTP server that serves Open Chain custom query endpoints.
type RESTServer struct {
	httpServer  *http.Server
	mux         *http.ServeMux
	keepers     Keepers
	ctxProvider ContextProvider
	listenAddr  string
}

// NewRESTServer creates a new REST API server.
//
// Parameters:
//   - addr: listen address (e.g., ":1318" or "localhost:1318")
//   - otk: OTK module keeper
//   - uid: Universal ID module keeper
//   - govuid: Governance-by-UID module keeper
//   - achievement: Achievement module keeper
//   - ctxProvider: function returning the latest sdk.Context for queries
func NewRESTServer(
	addr string,
	otk *otkkeeper.Keeper,
	uid *uidkeeper.Keeper,
	govuid *govuidkeeper.Keeper,
	achievement *achievementkeeper.Keeper,
	ctxProvider func() sdk.Context,
) *RESTServer {
	keepers := Keepers{
		OTK:         otk,
		UID:         uid,
		GovUID:      govuid,
		Achievement: achievement,
	}

	mux := http.NewServeMux()
	RegisterRoutes(mux, keepers, ctxProvider)

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{
			"status": "ok",
			"chain":  "openchain",
		})
	})

	return &RESTServer{
		httpServer: &http.Server{
			Addr:         addr,
			Handler:      withCORS(mux),
			ReadTimeout:  10 * time.Second,
			WriteTimeout: 10 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
		mux:         mux,
		keepers:     keepers,
		ctxProvider: ctxProvider,
		listenAddr:  addr,
	}
}

// Start begins serving HTTP requests. This call blocks until the server
// is stopped or encounters an error.
func (s *RESTServer) Start() error {
	fmt.Printf("Open Chain REST API listening on %s\n", s.listenAddr)
	err := s.httpServer.ListenAndServe()
	if err == http.ErrServerClosed {
		return nil
	}
	return err
}

// Stop gracefully shuts down the REST server with a 5-second timeout.
func (s *RESTServer) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.httpServer.Shutdown(ctx)
}

// withCORS wraps a handler with permissive CORS headers for development.
// In production, restrict Access-Control-Allow-Origin to wallet origins.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

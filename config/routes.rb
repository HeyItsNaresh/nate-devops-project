Rails.application.routes.draw do
  # CRUD endpoints
  resources :items, only: [:index, :show, :create, :update, :destroy]

  # Health endpoint for Docker and Kubernetes
  get "/up", to: "rails/health#show", as: :rails_health_check
end
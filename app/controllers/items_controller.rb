class ItemsController < ApplicationController

  # GET /items - Show all items
  def index
    items = NateItem.all
    render json: items
  end

  # GET /items/:id - Show one item
  def show
    item = NateItem.find(params[:id])
    render json: item
  end

  # POST /items - Create an item
  def create
    item = NateItem.new(item_params)

    if item.save
      render json: item, status: :created
    else
      render json: item.errors, status: :unprocessable_entity
    end
  end

  # PUT /items/:id - Update an item
  def update
    item = NateItem.find(params[:id])

    if item.update(item_params)
      render json: item
    else
      render json: item.errors, status: :unprocessable_entity
    end
  end

  # DELETE /items/:id - Delete an item
  def destroy
    item = NateItem.find(params[:id])
    item.destroy
    head :no_content
  end

  private

  # Allow name and description from JSON requests
  def item_params
    params.permit(:name, :description)
  end

end
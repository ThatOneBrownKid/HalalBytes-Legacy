class ReviewsController < ApplicationController
  before_action :set_restaurant
  before_action :set_review, only: %i[show edit update destroy]

  # GET /restaurants/:restaurant_id/reviews
  def index
    sort = params[:sort]

    @reviews = case sort
               when 'newest'
                 @restaurant.reviews.order(created_at: :desc)
               when 'oldest'
                 @restaurant.reviews.order(created_at: :asc)
               when 'highest_rating'
                 @restaurant.reviews.order(rating: :desc)
               when 'lowest_rating'
                 @restaurant.reviews.order(rating: :asc)
               else
                 @restaurant.reviews.order(created_at: :desc) # Default: newest first
               end
  end

  # GET /restaurants/:restaurant_id/reviews/1
  def show
  end

  # GET /restaurants/:restaurant_id/reviews/new
  def new
    @review = @restaurant.reviews.new
  end

  # GET /restaurants/:restaurant_id/reviews/1/edit
  def edit
  end

  # POST /restaurants/:restaurant_id/reviews
  def create
    @review = @restaurant.reviews.new(review_params)
    @review.user = current_user

    analysis_service = aws_image_analysis_service

    # text analysis first (content is available immediately)
    text_analysis = analysis_service.analyze_text(@review.content)
    if !text_analysis[:safe_content]
      @review.errors.add(:content, "contains inappropriate content")
      return respond_with_errors(text_analysis[:content_warnings])
    end

    # Save review + attachments so blobs are committed and uploaded
    if @review.save
      # Now run image analysis AFTER save
      if @review.images.attached?
        is_safe = analysis_service.analyze_image(@review.images)
        if !is_safe
          @review.images.purge
          @review.update_column(:content, "rejected_for_unsafe_images")
          @review.destroy
          return respond_with_errors(["Image contains inappropriate content"])
        end          
      end
      respond_success
    else
      respond_with_errors(@review.errors.full_messages)
    end
  end
  private

  def aws_image_analysis_service
    @aws_image_analysis_service ||= AwsImageAnalysisService.new
  end


  def respond_with_errors(warnings)
    session[:content_warnings] = warnings
    session[:content_warnings_views] = 3 # Show for 1 page load
    respond_to do |format|
      format.html { redirect_to restaurant_path(@restaurant)}
      format.json { render json: { error: "Validation failed", warnings: warnings }, status: :unprocessable_entity }
    end
  end

  def respond_success
    respond_to do |format|
      format.html { redirect_to restaurant_path(@restaurant) }
      format.json { render :show, status: :created, location: @review }
    end
  end

  

  # PATCH/PUT /restaurants/:restaurant_id/reviews/1
  def update
    @review = @restaurant.reviews.new(review_params)
    @review.user = current_user

    analysis_service = aws_image_analysis_service

    # text analysis first (content is available immediately)
    text_analysis = analysis_service.analyze_text(@review.content)
    print("text:",text_analysis)
    if !text_analysis[:safe_content]
      @review.errors.add(:content, "contains inappropriate content")
      return respond_with_errors(text_analysis[:content_warnings])
    end

    # Save review + attachments so blobs are committed and uploaded
    if @review.update(review_params)
      # Now run image analysis AFTER save
      if @review.images.attached?
        is_safe = analysis_service.analyze_image(@review.images)
        if !is_safe
          @review.images.purge
          @review.update_column(:content, "rejected_for_unsafe_images")
          return respond_with_errors(["Image contains inappropriate content"])
        end          
      end
      respond_success
    else
      respond_with_errors(@review.errors.full_messages)
    end
  end
  private

  # DELETE /restaurants/:restaurant_id/reviews/1
  def destroy
    @review.destroy

    respond_to do |format|
      # Changed redirect to go to the parent restaurant's show page
      format.html { redirect_to restaurant_path(@restaurant)}
      format.json { head :no_content }
    end
  end

  def upload_image
    if params[:image]
      # Attach the image to a temporary ActiveStorage blob
      print("Uploading image...")
      uploaded_image = ActiveStorage::Blob.create_and_upload!(
        io: params[:image],
        filename: params[:image].original_filename,
        content_type: params[:image].content_type
      )
      review.images.attach(uploaded_image)

      # Generate the URL for the uploaded image
      image_url = url_for(uploaded_image)

      # Return the image URL as JSON
      render json: { url: image_url }, status: :ok

    else
      render json: { error: "No image provided" }, status: :unprocessable_entity
    end

  end
  private

  # Find the associated restaurant for the nested routes
  def set_restaurant
    @restaurant = Restaurant.find(params[:restaurant_id])
  end

  # Find the specific review for actions like show, edit, update, and destroy
  def set_review
    @review = @restaurant.reviews.find(params[:id])
  end

  # Permit the allowed parameters for creating/updating reviews
  def review_params
    params.require(:review).permit(:content, :rating, :parent_id, images: [])
  end
end

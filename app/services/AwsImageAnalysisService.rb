# AwsAnalysisService is a service class responsible for analyzing images and text using AWS Rekognition and Comprehend.
# It provides functionality to detect moderation labels in an image, determine if the image is safe for work, and analyze text for sentiment and toxic content.
#
# Example usage:
#   service = AwsAnalysisService.new
#   image_result = service.analyze_image(image_blob)
#   if image_result[:safe_for_work]
#     puts "Image is safe for work."
#   else
#     puts "Image is not safe for work."
#   end
#
#   text_result = service.analyze_text(text)
#   if text_result[:safe_content]
#     puts "Text is safe."
#   else
#     puts "Text contains toxic content."
#   end
#
# The service requires AWS credentials to be set in the environment variables:
# - AWS_REGION: The AWS region (default is 'us-east-1').
# - AWS_ACCESS_KEY_ID: The AWS access key ID.
# - AWS_SECRET_ACCESS_KEY: The AWS secret access key.
# - AWS_SESSION_TOKEN: (Optional) The AWS session token.
class AwsImageAnalysisService
  def initialize
    credentials = {
      region: ENV['AWS_REGION'] || 'us-east-2',
      #access_key_id: ENV['AWS_ACCESS_KEY_ID'], # for local testing, use IAM roles in production
      #secret_access_key: ENV['AWS_SECRET_ACCESS_KEY'] # for local testing, use IAM roles in production
    }

    credentials[:session_token] = ENV['AWS_SESSION_TOKEN'] if ENV['AWS_SESSION_TOKEN']
    @s3_client = Aws::S3::Client.new(credentials)
    #@lambda_client = Aws::Lambda::Client.new(credentials)
    @rekognition_client = Aws::Rekognition::Client.new(credentials)
    credentials[:region] = 'us-east-1' # Comprehend is only available in us-east-1
    @comprehend_client = Aws::Comprehend::Client.new(credentials)
  rescue => e
    Rails.logger.error "AWS initialization error: #{e.message}"
    raise
  end

   def analyze_image(images)
    images.each do |image|
      blob    = image.blob
      service = blob.service
      bucket = service.bucket.name
      key    = blob.key

      puts "Bucket: #{bucket}, Key: #{key}"
      response = @rekognition_client.detect_moderation_labels(
       image: { s3_object: { bucket: bucket, name: key } },
       min_confidence: 60
     )
     safe = safe_for_work?(response.moderation_labels)
     if !safe
       return false
     end
    end
    true
    # {
    #   safe_for_work: ,
    #   labels: response.moderation_labels.map(&:name)
    # }
   rescue Aws::Rekognition::Errors::ServiceError => e
     Rails.logger.error "AWS Rekognition error: #{e.message}"
     { error: 'Image analysis failed', safe_for_work: false }
   end

  def analyze_text(raw_text)
    return nil if raw_text.blank?
    text = spellcheck_text(raw_text)
    # Split text into segments of max 1KB (1024 bytes), up to 10 segments, total <= 10KB
    segments = []
    bytes = text.encode('UTF-8').bytes
    while bytes.any? && segments.size < 10
      segment_bytes = bytes.shift(1024)
      segments << { text: segment_bytes.pack('C*').force_encoding('UTF-8') }
    end

    # Ensure total size <= 10KB
    total_size = segments.sum { |seg| seg[:text].bytesize }
    if total_size > 10_240
      Rails.logger.warn "Text exceeds 10KB limit for Comprehend toxicity analysis. Truncating."
      # Truncate segments to fit within 10KB
      allowed = 0
      segments = segments.take_while do |seg|
        allowed += seg[:text].bytesize
        allowed <= 10_240
      end
    end

    toxic_content = @comprehend_client.detect_toxic_content(
      text_segments: segments,
      language_code: 'en'
    )
    warnings = extract_warnings(segments, toxic_content.result_list).reject(&:nil?)

    {
      content_warnings: warnings,
      safe_content: warnings.empty?
    }
  rescue Aws::Comprehend::Errors::ServiceError => e
    Rails.logger.error "AWS Comprehend error: #{e.message}"
    { error: 'Text analysis failed', safe_content: false }
  end

   private

   def safe_for_work?(labels)
     unsafe_categories = [
       'Explicit', 
       'Non-Explicit Nudity of Intimate parts and Kissing',
       'Violence',
       'Swimwear or Underwear',
       'Visually Disturbing',
       'Drugs & Tobacco',
       'Alcohol',
       'Hate Symbols',
       'Suggestive'
     ]
     labels.none? { |label| unsafe_categories.include?(label.name) }
   end

  THRESHOLD = 0.55
  def extract_warnings(segments, result_list)
    warnings = []
    result_list.each_with_index.flat_map do |result, idx|
      result.labels.map do |label|
        if label.score >= THRESHOLD
          warnings << {
            category: label.name,
            score: label.score,
            text: segments[idx][:text]
          }
        end
      end
    end
  end
  
  def spellcheck_text(text)
    speller = FFI::Aspell::Speller.new('en_US')
    text.split.map do |word|
      normalized = word.gsub('0', 'o').gsub('1', 'i').gsub('5', 's')
      speller.correct?(normalized) ? normalized : (speller.suggestions(normalized).first || normalized)
    end.join(' ')
  end

end
  
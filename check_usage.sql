-- Check actual media counts vs usage table
SELECT 'Actual media counts:' as info;
SELECT
  m.memorial_id,
  COUNT(*) as total_media,
  COUNT(CASE WHEN file_type = 'image' THEN 1 END) as photo_count,
  COUNT(CASE WHEN file_type = 'video' THEN 1 END) as video_count
FROM media m
GROUP BY m.memorial_id
ORDER BY memorial_id;

SELECT 'Usage table data:' as info;
SELECT * FROM memorial_usage ORDER BY memorial_id;

SELECT 'Comparison - mismatches:' as info;
WITH actual_counts AS (
  SELECT
    m.memorial_id,
    COUNT(*) as actual_total,
    COUNT(CASE WHEN file_type = 'image' THEN 1 END) as actual_photos,
    COUNT(CASE WHEN file_type = 'video' THEN 1 END) as actual_videos
  FROM media m
  GROUP BY m.memorial_id
),
usage_counts AS (
  SELECT
    memorial_id,
    media_count,
    photo_count,
    video_count
  FROM memorial_usage
)
SELECT
  ac.memorial_id,
  ac.actual_total,
  uc.media_count as usage_total,
  ac.actual_photos,
  uc.photo_count as usage_photos,
  ac.actual_videos,
  uc.video_count as usage_videos,
  CASE WHEN ac.actual_total != uc.media_count OR ac.actual_photos != uc.photo_count OR ac.actual_videos != uc.video_count THEN 'MISMATCH' ELSE 'OK' END as status
FROM actual_counts ac
LEFT JOIN usage_counts uc ON ac.memorial_id = uc.memorial_id
ORDER BY ac.memorial_id;



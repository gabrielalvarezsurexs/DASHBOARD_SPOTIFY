"""Prueba de humo: Spark escribe y lee Parquet en MinIO (S3A).

    docker compose exec spark spark-submit \
        --packages org.apache.hadoop:hadoop-aws:3.3.4 /home/jovyan/jobs/smoke_test.py
"""

import sys

sys.path.insert(0, "/home/jovyan/jobs")

from common import BRONZE, get_spark  # noqa: E402

spark = get_spark("smoke_test")
path = f"{BRONZE}/_smoke_test"
spark.range(1000).write.mode("overwrite").parquet(path)
n = spark.read.parquet(path).count()
assert n == 1000, n
print(f"SMOKE OK: Spark {spark.version} escribió y leyó {n} filas en {path}")
spark.stop()

from supabase_client import supabase

print("Connecting to Supabase...")

response = (
    supabase
    .table("education_levels")
    .select("*")
    .execute()
)

print("Connection successful!")
print("Data received:")
print(response.data)
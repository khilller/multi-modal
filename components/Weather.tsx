export async function Weather({ city, unit }: { city: string; unit: string }) {
    const data = await fetch(
      `https://api.example.com/weather?city=${city}&unit=${unit}`,
    );
  
    return (
      <div>
        <h1>{city}</h1>
        <p>{unit}</p>
      </div>
    );
  }
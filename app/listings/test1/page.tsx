export default function ListingPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Listing</h1>
      <p>Listing ID: {params.id}</p>
      <p>Test for deep linking.</p>
    </div>
  );
}
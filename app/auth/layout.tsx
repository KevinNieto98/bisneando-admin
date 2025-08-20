
export default function ShopLayout( { children }: {
  children: React.ReactNode;
} ) {
  return (
    <main className=" justify-center">
      <div className="">

        { children }

      </div>
    </main>
  );
}
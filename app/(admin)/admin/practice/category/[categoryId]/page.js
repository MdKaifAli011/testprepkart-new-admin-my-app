import React from "react";
import MainLayout from "../../../../layouts/MainLayout";
import PracticeSubCategoryManagement from "../../../../components/features/PracticeSubCategoryManagement";

const PracticeCategoryPage = async ({ params }) => {
  const { categoryId } = await params;
  return (
    <MainLayout>
      <PracticeSubCategoryManagement categoryId={categoryId} />
    </MainLayout>
  );
};

export default PracticeCategoryPage;

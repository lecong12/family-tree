    return (
        <div className="w-screen h-screen flex flex-col bg-gray-50">
            <Header
                isolatedCount={isolatedCount}
                filterMode={filterMode}
                onFilterModeChange={handleFilterMode}
                onOpenGuestCodeModal={handleOpenGuestCodeModal}
                currentView={viewMode}
                onChangeView={setViewMode}
            />

            {/* LOGIC SỬA ĐỔI: Chỉ hiển thị Toolbar (Search/PageSize) khi ở chế độ 'list' */}
            {viewMode === 'list' && (
                <Toolbar 
                    search={search} 
                    onSearchChange={handleSearch} 
                    pageSize={pageSize} 
                    onPageSizeChange={handlePageSizeChange} 
                    onAddPerson={() => setAddPersonModalOpen(true)} 
                />
            )}

            <LoadingOverlay isLoading={isLoading} />

            <div className={`flex-1 overflow-auto bg-gray-50 ${viewMode === 'list' ? 'p-4' : ''}`}>
                {viewMode === 'list' ? (
                    <div className="max-w-[900px] mx-auto bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl overflow-hidden">
                        <PersonList
                            paginated={paginated}
                            connectedIds={connectedIds}
                            currentPage={currentPage}
                            pageSize={pageSize}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            onSort={handleSort}
                            onPersonClick={handlePersonClick}
                        />
                    </div>
                ) : (
                    <FamilyTreeFlow
                        persons={persons}
                        spouses={spouses}
                        parentChilds={parentChilds}
                        searchRootPersonId={null} 
                        searchGenerations={null} 
                        onPersonNodeClick={handlePersonClick}
                        onRelationshipNodeClick={handleRelationshipClick}
                    />
                )}
            </div>

            {/* Chỉ hiển thị Phân trang khi ở chế độ 'list' */}
            {viewMode === 'list' && (
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    pageSize={pageSize} 
                    totalItems={filtered.length} 
                    onPageChange={setCurrentPage} 
                />
            )}

            {/* Modals - Giữ nguyên các chức năng modal */}
            <PersonDetailModal
                isOpen={personDetailModalOpen}
                onClose={handleClosePersonDetailModal}
                person={selectedPerson}
                onAddSpouse={handleAddSpouseFromPerson}
                onAddChild={handleAddChildFromSpouse}
                onUpdate={refetchAll}
            />
            <AddSpouseModal isOpen={addSpouseModalOpen} onClose={handleCloseAddSpouseModal} onSuccess={handleSpouseModalSuccess} person={selectedPerson} />
            <AddChildModal isOpen={addChildModalOpen} onClose={handleCloseAddChildModal} onSuccess={handleChildModalSuccess} spouseId={selectedSpouseIdForChild} />
            <AddPersonModal isOpen={addPersonModalOpen} onClose={handleCloseAddPersonModal} onSuccess={handlePersonModalSuccess} />
            <GuestCodeModal isOpen={guestCodeModalOpen} onClose={handleCloseGuestCodeModal} />
        </div>
    );
